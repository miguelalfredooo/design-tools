---
phase: 01-security-foundation
plan: 05
type: execute
wave: 5
depends_on: [04]
files_modified:
  - middleware.ts
  - next.config.ts
autonomous: true
requirements: [SEC-03]
must_haves:
  truths:
    - "CORS only allows same-origin requests to /api/design/* routes"
    - "Cross-origin requests receive Access-Control-Allow-Origin: <origin> only if origin matches request origin"
    - "Cross-origin requests without credentials are rejected"
    - "Next.js middleware applies CORS policy before routes execute"
    - "API routes enforce sessionToken validation (Wave 3) AFTER CORS check passes"
  artifacts:
    - path: "middleware.ts"
      provides: "CORS middleware for all /api/design/* routes"
      exports: ["middleware", "config"]
    - path: "next.config.ts"
      provides: "Next.js configuration with security headers"
      contains: "headers.*x-content-type-options|x-frame-options"
  key_links:
    - from: "Browser fetch request"
      to: "middleware.ts"
      via: "Request handling"
      pattern: "origin.*header"
    - from: "middleware.ts"
      to: "app/api/design/* routes"
      via: "CORS validation → route execution"
      pattern: "ACCESS-CONTROL-ALLOW-ORIGIN"
---

<objective>
Add CORS protection to all `/api/design/*` routes and security headers to Next.js config. Restrict API access to same-origin requests.

Purpose: Prevent cross-site request forgery (CSRF) and reduce attack surface. Only requests from the same origin can access design tools API.

Output: Next.js middleware enforcing CORS policy, Next.js config with security headers.
</objective>

<execution_context>
@/Users/miguelarias/Code/design-tools/next.config.ts (existing config)
@/Users/miguelarias/Code/design-tools/middleware.ts (if exists; create if not)
@/Users/miguelarias/Code/design-tools/package.json (dependencies check)
</execution_context>

<context>
CORS (Cross-Origin Resource Sharing) controls which origins can access the API.

Current state: No CORS headers → browsers allow all cross-origin requests.

Protected state: Middleware returns CORS headers that restrict to same-origin only.

How it works:
1. Browser makes request to /api/design/sessions/[id]
2. middleware.ts intercepts the request
3. Middleware checks request origin against allowed origins (same-origin only)
4. If origin allowed: adds Access-Control-Allow-Origin header, request proceeds
5. If origin denied: returns 403 Forbidden
6. Route handler executes (if request passes both CORS + sessionToken validation)

Same-origin means: origin of the request matches origin the app is running on.
Examples:
- Request from https://myapp.com to https://myapp.com/api/design/* → ALLOWED
- Request from https://evil.com to https://myapp.com/api/design/* → BLOCKED

In development (localhost):
- Request from http://localhost:3500 to http://localhost:3500/api/* → ALLOWED

Next.js middleware runs before route handlers, making it perfect for CORS.
</context>

<tasks>

<task type="auto">
  <name>Task 11: Create middleware.ts with CORS policy for /api/design/* routes</name>
  <files>middleware.ts</files>
  <action>
Create Next.js middleware file at project root: `middleware.ts` (sibling to app/ and lib/)

Implement CORS protection for all /api/design/* routes:

```typescript
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only apply CORS to /api/design/* routes
  if (!pathname.startsWith("/api/design/")) {
    return NextResponse.next();
  }

  // Get request origin
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // Determine allowed origins (same-origin + localhost for dev)
  const allowedOrigins = [
    `http://localhost:3500`,
    `http://localhost:3456`, // alfredo-studio dev port (if co-hosted)
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  // Check if request origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  // Handle preflight requests (browser checks CORS before actual request)
  if (request.method === "OPTIONS") {
    if (isAllowedOrigin) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin!,
          "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400", // 24 hours
          "Access-Control-Allow-Credentials": "true", // Allow cookies
        },
      });
    }
    return new NextResponse(null, { status: 403 });
  }

  // For actual requests (GET, POST, PATCH, DELETE)
  const response = NextResponse.next();
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

export const config = {
  matcher: "/api/design/:path*", // Only apply to /api/design/* routes
};
```

Key points:
- middleware runs before route handlers (applied at edge for security)
- matcher: "/api/design/:path*" restricts middleware to only those routes
- OPTIONS requests are preflight checks (browser sends before actual request)
- Preflight returns 204 with CORS headers if origin allowed, 403 if not
- Regular requests (GET, POST, etc.) continue to route handler if origin allowed
- Session token validation happens in route handlers (Wave 3)
- allowedOrigins includes localhost for dev, VERCEL_URL for production

Environment variables used:
- VERCEL_URL: Set automatically by Vercel deployment (production domain)
- NODE_ENV: Already provided by Next.js

Include comments explaining each section.
  </action>
  <verify>
    <automated>
Test 1: Middleware file exists
```bash
ls -la /Users/miguelarias/Code/design-tools/middleware.ts
```

Test 2: Middleware includes CORS headers
```bash
grep -n "Access-Control-Allow-Origin\|Access-Control-Allow-Methods" /Users/miguelarias/Code/design-tools/middleware.ts
```
Should show multiple matches.

Test 3: Matcher config correct
```bash
grep -n "matcher.*api/design" /Users/miguelarias/Code/design-tools/middleware.ts
```
Should show matcher configured for /api/design routes.

Test 4: Run dev server and test preflight request
```bash
curl -X OPTIONS http://localhost:3500/api/design/sessions \
  -H "Origin: http://localhost:3500" \
  -i
```
Should return 204 with Access-Control-Allow-Origin header.

Test 5: Cross-origin request from different origin
```bash
curl -X OPTIONS http://localhost:3500/api/design/sessions \
  -H "Origin: https://evil.com" \
  -i
```
Should return 403 (no CORS headers).
    </automated>
  </verify>
  <done>
- middleware.ts created at project root
- CORS policy implemented for /api/design/* routes
- Preflight (OPTIONS) requests handled correctly
- Same-origin requests allowed, cross-origin requests blocked
- Credentials (cookies) allowed in requests
- Production domain (VERCEL_URL) configured
- Next.js route handlers can now assume request passed CORS check
  </done>
</task>

<task type="auto">
  <name>Task 12: Add security headers to next.config.ts</name>
  <files>next.config.ts</files>
  <action>
Update next.config.ts to include HTTP security headers.

Read current next.config.ts. If headers section doesn't exist, add it:

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... existing config ...

  async headers() {
    return [
      {
        source: "/api/design/:path*",
        headers: [
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking (framing the app in malicious sites)
          { key: "X-Frame-Options", value: "DENY" },
          // Referrer policy (don't leak referrer to external sites)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permission policy (prevent certain browser features)
          { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

If headers already exist, ADD the above entries to the existing /api/design/:path* rule.

Explanation:
- X-Content-Type-Options: nosniff — Don't auto-detect file types (prevents drive-by downloads)
- X-Frame-Options: DENY — Don't allow embedding in iframes (prevents clickjacking)
- Referrer-Policy: strict-origin-when-cross-origin — Don't send referrer to other sites
- Permissions-Policy — Disable browser features the API doesn't need (location, microphone, camera)

These headers are sent with every response from /api/design/* routes, hardening the API.
  </action>
  <verify>
    <automated>
Test 1: next.config.ts includes headers function
```bash
grep -n "async headers\|headers()" /Users/miguelarias/Code/design-tools/next.config.ts
```
Should show headers function defined.

Test 2: Security headers configured
```bash
grep -n "X-Content-Type-Options\|X-Frame-Options\|Referrer-Policy" /Users/miguelarias/Code/design-tools/next.config.ts
```
Should show all three headers configured.

Test 3: Run build to verify config is valid
```bash
cd /Users/miguelarias/Code/design-tools && npm run build 2>&1 | head -20
```
Should not report config errors.

Test 4: Run dev server and check response headers
```bash
curl -i http://localhost:3500/api/design/sessions
```
Should include X-Content-Type-Options, X-Frame-Options, Referrer-Policy headers.
    </automated>
  </verify>
  <done>
- next.config.ts updated with security headers function
- X-Content-Type-Options: nosniff header configured
- X-Frame-Options: DENY header configured
- Referrer-Policy header configured
- Headers apply to all /api/design/* responses
- Build succeeds with new configuration
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. middleware.ts created with CORS policy
2. Only same-origin requests reach /api/design/* routes
3. Cross-origin requests return 403 (no CORS headers)
4. HTTP security headers added to all API responses
5. Preflight (OPTIONS) requests handled correctly
6. Build succeeds without errors
7. Production domain (VERCEL_URL) configured for deployed environments

Full security stack now in place:
- Wave 1: Session token generation and validation utilities ✓
- Wave 2: Login endpoint returning HTTP-only session cookie ✓
- Wave 3: Protected routes validating sessionToken via middleware ✓
- Wave 4: Client-side credentials removed (localStorage + request body) ✓
- Wave 5: CORS protection and security headers ✓
</verification>

<success_criteria>
- Middleware.ts exists and applies CORS policy to /api/design/*
- Same-origin requests allowed, cross-origin requests blocked
- Preflight requests return 204 with CORS headers
- HTTP security headers in all API responses
- Build succeeds with new middleware and config
- No credentials visible in localStorage or network requests
- No cross-origin requests can access design API
- Session tokens validated server-side on every admin operation
</success_criteria>

<output>
After execution, create `.planning/01-security-foundation/01-security-foundation-05-SUMMARY.md` with:
- Files created: middleware.ts
- Files updated: next.config.ts
- CORS policy: Same-origin only, blocking cross-origin requests
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- Result: Complete security foundation with session tokens, CORS, and security headers
</output>
