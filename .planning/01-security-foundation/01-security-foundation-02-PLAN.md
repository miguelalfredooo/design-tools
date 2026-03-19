---
phase: 01-security-foundation
plan: 02
type: execute
wave: 2
depends_on: [01]
files_modified:
  - app/api/auth/login/route.ts
  - app/api/auth/route.ts
autonomous: true
requirements: [SEC-01]
must_haves:
  truths:
    - "POST /api/auth/login with correct password sets HTTP-only sessionToken cookie"
    - "HTTP-only cookie is not accessible to client-side JavaScript"
    - "Cookie max-age is set to 3600 seconds (1 hour)"
    - "Invalid password returns 401 without setting cookie"
    - "Existing /api/auth endpoint continues to work (backward compat during migration)"
  artifacts:
    - path: "app/api/auth/login/route.ts"
      provides: "New login endpoint that sets HTTP-only session cookie"
      contains: "Set-Cookie.*httpOnly.*secure.*sameSite"
    - path: "app/api/auth/route.ts"
      provides: "Kept for backward compatibility during migration"
      status: "unchanged for now"
  key_links:
    - from: "hooks/use-admin.ts"
      to: "app/api/auth/login/route.ts"
      via: "fetch POST /api/auth/login in login() callback"
      pattern: "fetch.*api/auth/login"
---

<objective>
Update login endpoint to create and return HTTP-only session tokens instead of relying on client-side password storage.

Purpose: Eliminate client-side password storage. Tokens become the source of truth for admin authorization, with server-side expiry enforcement.

Output: New `/api/auth/login` route that validates password and sets HTTP-only `sessionToken` cookie.
</objective>

<execution_context>
@/Users/miguelarias/Code/design-tools/app/api/auth/route.ts (existing endpoint)
@/Users/miguelarias/Code/design-tools/.planning/01-security-foundation/01-security-foundation-01-PLAN.md (Session utilities from Wave 1)
</execution_context>

<context>
Current behavior:
- POST `/api/auth` validates password string, returns { ok: true }
- Client-side code stores password in localStorage
- Every API call includes password in request body

New behavior:
- POST `/api/auth/login` validates password, creates session token, returns it in HTTP-only cookie
- Client-side code no longer stores credentials
- Protected routes validate token from cookie (middleware added in Wave 3)
</context>

<tasks>

<task type="auto">
  <name>Task 3: Create new /api/auth/login endpoint returning HTTP-only session cookie</name>
  <files>app/api/auth/login/route.ts</files>
  <action>
Create new route file at `app/api/auth/login/route.ts` (Note: this is a NEW directory under auth/).

Implement POST handler:

```typescript
import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/session";

export async function POST(request: Request) {
  const { password } = await request.json();
  const expected = process.env.DESIGN_TOOLS_PASSWORD;

  // Validate password
  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  // Create session token
  const { token, expiresAt } = createSessionToken();

  // Return response with HTTP-only cookie
  const response = NextResponse.json({ ok: true });

  // Set cookie: httpOnly (not accessible to JS), secure (HTTPS only in production), sameSite (CSRF protection)
  response.cookies.set("sessionToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS only in prod, HTTP ok in dev
    sameSite: "strict",
    maxAge: 3600, // 1 hour in seconds
    path: "/",
  });

  return response;
}
```

Key points:
- Import createSessionToken from @/lib/session (created in Wave 1)
- Validate password against DESIGN_TOOLS_PASSWORD env var
- Call createSessionToken() to generate new token
- Use NextResponse.cookies.set() to create HTTP-only cookie
- Set secure=true only in production (dev needs HTTP)
- maxAge in SECONDS (not milliseconds) — 3600 = 1 hour
- sameSite="strict" prevents cross-site cookie sending
- Return { ok: true } on success (same as old endpoint for compat)

Include comments explaining each security attribute.
  </action>
  <verify>
    <automated>
POST request with correct password:
```bash
curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"<DESIGN_TOOLS_PASSWORD>"}' \
  -i
```

Check response headers for Set-Cookie with httpOnly, sameSite=Strict, max-age=3600.

POST request with incorrect password:
```bash
curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}' \
  -i
```

Should return 401, no Set-Cookie header.

Verify cookie NOT accessible from JavaScript:
Open browser DevTools → Application → Cookies → localhost:3500
Should see sessionToken marked as "HttpOnly" (no access from JS console).
    </automated>
  </verify>
  <done>
- Route file created at `app/api/auth/login/route.ts`
- POST handler validates password against env var
- Valid password: returns 200 + HTTP-only sessionToken cookie (max-age=3600, sameSite=strict)
- Invalid password: returns 401, no cookie
- Cookie not visible in DevTools JavaScript console (httpOnly working)
- Imports and uses createSessionToken from Wave 1
  </done>
</task>

<task type="auto">
  <name>Task 4: Keep existing /api/auth endpoint for backward compatibility during migration</name>
  <files>app/api/auth/route.ts</files>
  <action>
Update existing endpoint to log a deprecation warning and maintain basic functionality during migration period. This allows old code to continue working while new code uses /api/auth/login.

Modify `app/api/auth/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const expected = process.env.DESIGN_TOOLS_PASSWORD;

  // Log deprecation notice in server logs (appears in terminal during dev)
  console.warn("[DEPRECATED] POST /api/auth is deprecated. Use POST /api/auth/login instead (returns HTTP-only cookie).");

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
```

Note: This endpoint still validates password but does NOT return a cookie. It's kept only for backward compatibility. In later waves, client code will be migrated to use /api/auth/login instead.

Do NOT add session token creation here. Clients calling this endpoint will NOT be authenticated for protected routes until they use /api/auth/login.
  </action>
  <verify>
    <automated>
POST to /api/auth with correct password should still return 200 { ok: true }:
```bash
curl -X POST http://localhost:3500/api/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"<DESIGN_TOOLS_PASSWORD>"}' \
  -i
```

Check server logs (terminal) for deprecation warning.

POST to /api/auth should NOT include Set-Cookie header (unlike /api/auth/login):
```bash
curl -X POST http://localhost:3500/api/auth \
  -H "Content-Type: application/json" \
  -d '{"password":"<DESIGN_TOOLS_PASSWORD>"}' \
  -i | grep -i "set-cookie"
```

Should return nothing (no cookie).
    </automated>
  </verify>
  <done>
- `app/api/auth/route.ts` updated with deprecation warning
- Still validates password and returns { ok: true }
- Does NOT set session cookie
- Deprecation warning logged to server console
- Ready for migration in later waves (clients switch to /api/auth/login)
  </done>
</task>

</tasks>

<verification>
After Task 3 and Task 4 complete:
1. New /api/auth/login endpoint exists and sets HTTP-only cookie on valid password
2. Old /api/auth endpoint still works but logs deprecation warning
3. Session tokens generated via createSessionToken (Wave 1 utility)
4. Cookie security attributes correct (httpOnly, secure, sameSite, maxAge)
5. Next wave can begin updating protected routes to validate tokens via middleware
</verification>

<success_criteria>
- POST /api/auth/login with valid password returns 200 + HTTP-only sessionToken cookie
- POST /api/auth/login with invalid password returns 401, no cookie
- POST /api/auth still works (backward compat) but logs deprecation warning
- sessionToken cookie NOT visible in browser JS console (httpOnly enforced)
- Cookie expires in 1 hour (maxAge=3600)
- sameSite=strict prevents cross-site cookie sending
</success_criteria>

<output>
After execution, create `.planning/01-security-foundation/01-security-foundation-02-SUMMARY.md` with:
- New route: app/api/auth/login/route.ts
- Endpoint signature: POST /api/auth/login → { password: string }
- Response: 200 { ok: true } + HTTP-only sessionToken cookie
- Cookie attributes: httpOnly, secure (prod only), sameSite=strict, maxAge=3600
- Backward compat: /api/auth kept with deprecation warning
</output>
