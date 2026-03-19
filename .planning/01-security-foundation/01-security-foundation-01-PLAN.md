---
phase: 01-security-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/lib/auth-middleware.ts
  - app/api/auth/login/route.ts
  - app/lib/session.ts
autonomous: true
requirements: [SEC-01, SEC-02]
must_haves:
  truths:
    - "HTTP-only session tokens can be set on successful password validation"
    - "Session token validation works on protected endpoints without revealing the token to client-side JavaScript"
    - "Session expiry is enforced server-side (1 hour max age)"
    - "Invalid or expired tokens return 401 Unauthorized"
  artifacts:
    - path: "app/lib/auth-middleware.ts"
      provides: "Middleware function to validate session tokens from cookies"
      exports: ["withAuth", "validateSessionToken"]
    - path: "app/api/auth/login/route.ts"
      provides: "POST endpoint that validates password and sets HTTP-only session cookie"
      contains: "Set-Cookie.*httpOnly"
    - path: "app/lib/session.ts"
      provides: "Session token generation and validation logic"
      exports: ["createSessionToken", "verifySessionToken"]
  key_links:
    - from: "hooks/use-admin.ts"
      to: "app/api/auth/login/route.ts"
      via: "fetch POST /api/auth/login"
      pattern: "fetch.*api/auth/login"
    - from: "app/api/design/sessions/[id]/route.ts"
      to: "app/lib/auth-middleware.ts"
      via: "withAuth middleware wrapper"
      pattern: "withAuth.*PATCH|DELETE"
---

<objective>
Implement HTTP-only session token generation and validation infrastructure. Replace password-in-localStorage mechanism with server-side validated session tokens.

Purpose: Move authentication state from client-side localStorage (visible in DevTools) to HTTP-only cookies (invisible to JavaScript), enabling server-side token expiry enforcement and eliminating credential exposure.

Output: Core auth utilities (middleware, session token generation/verification), updated login endpoint returning HTTP-only cookie, foundation for protecting all `/api/design/*` routes.
</objective>

<execution_context>
@/Users/miguelarias/Code/design-tools/hooks/use-admin.ts (current admin auth, stores password in localStorage)
@/Users/miguelarias/Code/design-tools/lib/design-api.ts (API client that passes adminPassword in request body)
@/Users/miguelarias/Code/design-tools/app/api/auth/route.ts (existing auth endpoint, currently returns { ok: true })
</execution_context>

<context>
Current auth architecture:
- `use-admin.ts` stores raw password in localStorage after successful `/api/auth` POST
- `design-api.ts` reads password from localStorage and includes it in every protected API call
- Session API routes manually check `adminPassword` string against `process.env.DESIGN_TOOLS_PASSWORD`
- No token expiry, no CORS protection, credentials visible in browser DevTools and Network tab

Migration strategy:
- Wave 1: Create session generation and validation utilities
- Wave 2: Update login endpoint to use new session infrastructure, return HTTP-only cookie
- Wave 3: Create auth middleware and update protected routes to use it
- Wave 4: Remove localStorage password storage from use-admin.ts
- Wave 5: Remove adminPassword from all API calls and design-api.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create session token utilities (generation, verification, expiry)</name>
  <files>app/lib/session.ts</files>
  <action>
Create TypeScript module exporting two functions:

1. `createSessionToken(): { token: string; expiresAt: number }`
   - Generate a cryptographically secure random 32-byte token (use crypto.getRandomValues or node:crypto on server)
   - Encode as hex string
   - Set expiresAt to current time + 3600000 ms (1 hour)
   - Return both values as object

2. `verifySessionToken(token: string): { valid: boolean; error?: string }`
   - Validate token is non-empty hex string
   - Check token exists in secure token store (in-memory Map for MVP, keyed by token)
   - If token found, verify expiresAt > Date.now()
   - Return { valid: true } if token exists and not expired
   - Return { valid: false, error: "Token expired" } if expiresAt <= Date.now()
   - Return { valid: false, error: "Token not found" } if token doesn't exist
   - Clean up expired tokens during verification (optional optimization)

Token storage: Use a module-level Map<string, { expiresAt: number }> to store active tokens. In production, this would be replaced with a database or Redis.

Include JSDoc comments for each function explaining parameters and return values.
  </action>
  <verify>
    <automated>
Node.js script: create a token, wait 100ms, verify it exists and is valid. Create token, set expiresAt to Date.now() - 1000, verify it returns expired error. Verify invalid token returns not found error.

Example test (run via `node`):
```javascript
const { createSessionToken, verifySessionToken } = require('./app/lib/session.ts');
const { token } = createSessionToken();
console.assert(verifySessionToken(token).valid === true, 'Valid token check failed');
console.assert(verifySessionToken('invalid').valid === false, 'Invalid token check failed');
console.log('Session token utilities verified');
```
    </automated>
  </verify>
  <done>
- `app/lib/session.ts` exists and exports `createSessionToken` and `verifySessionToken`
- Both functions include JSDoc comments
- Token storage mechanism works (tokens persist across calls within same process)
- Token expiry validation works (expired tokens return error)
- Invalid tokens return "not found" error
  </done>
</task>

<task type="auto">
  <name>Task 2: Create auth middleware for protecting API routes</name>
  <files>app/lib/auth-middleware.ts</files>
  <action>
Create TypeScript module exporting one async function:

`withAuth(handler: NextApiHandler): NextApiHandler`

This is a Higher-Order Function (HOF) that wraps Next.js route handlers to enforce authentication.

Flow:
1. Receives a route handler function (async (request: Request) => NextResponse)
2. Returns a wrapper function that:
   a. Extracts session token from request cookies (header: "cookie")
      - Parse using simple string split (cookie format: "sessionToken=abc123; path=/; other=value")
      - Extract value after "sessionToken=" and before next semicolon
   b. Calls verifySessionToken(token)
   c. If invalid: return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
   d. If valid: call the wrapped handler and return its response

Export type: `type NextApiHandler = (request: Request) => Promise<NextResponse>`

Include JSDoc explaining:
- What the middleware does
- How to use it (wrap route handler)
- Example usage

Do NOT apply middleware in this task. Just create the utility function.
  </action>
  <verify>
    <automated>
Create a test route handler that returns { ok: true }. Wrap it with withAuth. Simulate requests with valid/invalid/missing tokens. Verify:
- Valid token: returns { ok: true }
- Invalid token: returns { error: "Unauthorized" } with status 401
- Missing token: returns { error: "Unauthorized" } with status 401

Example check:
```bash
grep -n "withAuth\|validateSessionToken\|function.*middleware" app/lib/auth-middleware.ts | head -5
```
    </automated>
  </verify>
  <done>
- `app/lib/auth-middleware.ts` exists
- Exports `withAuth` HOF function
- `withAuth` extracts sessionToken from cookies
- Invalid/missing tokens return 401 Unauthorized
- Valid tokens allow handler to execute
- Function includes JSDoc comments
  </done>
</task>

</tasks>

<verification>
After Task 1 and Task 2 complete:
1. Both files exist in app/lib/
2. Session utilities create and validate tokens
3. Middleware correctly rejects unauthorized requests
4. Core infrastructure is in place for next wave (updating login endpoint and protected routes)
</verification>

<success_criteria>
- Token generation produces unique, hex-encoded, 64-character tokens
- Session token utilities handle expiry correctly (1-hour default)
- Auth middleware successfully rejects requests without valid tokens
- Middleware correctly parses cookies from request headers
- No credentials stored in localStorage yet (change comes in later waves)
- Foundation ready for routes to be protected in Wave 3
</success_criteria>

<output>
After execution, create `.planning/01-security-foundation/01-security-foundation-01-SUMMARY.md` with:
- Files created: app/lib/session.ts, app/lib/auth-middleware.ts
- Functions exported: createSessionToken, verifySessionToken, withAuth
- Token format: 64-character hex string
- Token expiry: 1 hour (3600000 ms)
- Key dependency: Both utilities use module-level Map for token storage (temporary, to be upgraded to database in later phase)
</output>
