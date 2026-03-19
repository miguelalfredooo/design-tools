# Phase 1: Security Foundation — Complete Planning

**Objective:** Replace localStorage credential storage with HTTP-only session tokens + implement CORS protection

**Timeline:** 5 waves of execution, estimated 2-3 hours total for Claude

## Executive Summary

This phase eliminates two critical security vulnerabilities:
1. Admin password stored in browser localStorage (visible in DevTools)
2. All API calls expose password in request body (visible in Network tab)

**New architecture:**
- Admin credentials → `/api/auth/login` endpoint → HTTP-only sessionToken cookie → automatic browser management → server-side token validation on protected routes
- CORS protection blocks cross-origin API access
- Security headers prevent common web attacks (MIME sniffing, clickjacking, referrer leaks)

## Wave Structure

### Wave 1: Foundation (Core Auth Infrastructure)
**Plans:** 01-security-foundation-01
**Tasks:** 2
- Create session token generation/verification utilities
- Create auth middleware for protecting routes

**Output:** `app/lib/session.ts`, `app/lib/auth-middleware.ts`

### Wave 2: Login Endpoint (Token Issuance)
**Plans:** 01-security-foundation-02
**Tasks:** 2
- Create new /api/auth/login endpoint returning HTTP-only cookie
- Keep /api/auth for backward compatibility during migration

**Output:** `app/api/auth/login/route.ts` (new), `/api/auth/route.ts` (updated with deprecation)

### Wave 3: Route Protection (Token Validation)
**Plans:** 01-security-foundation-03
**Tasks:** 4
- Protect PATCH/DELETE on `/api/design/sessions/[id]`
- Protect POST/PATCH/DELETE on `/api/design/sessions/[id]/options`
- Protect PATCH on `/api/design/sessions/[id]/votes`
- Protect DELETE on `/api/design/sessions/[id]/comments`

**Output:** 5 API route files updated to validate sessionToken from cookies

### Wave 4: Client Cleanup (Remove Credentials from Storage & Network)
**Plans:** 01-security-foundation-04
**Tasks:** 2
- Remove password storage from useAdmin hook
- Remove adminPassword from all API calls in design-api.ts

**Output:** `hooks/use-admin.ts` (simplified), `lib/design-api.ts` (cleaner API calls)

### Wave 5: Hardening (CORS + Security Headers)
**Plans:** 01-security-foundation-05
**Tasks:** 2
- Create middleware.ts with CORS policy
- Add security headers to next.config.ts

**Output:** `middleware.ts` (new), `next.config.ts` (updated)

## Files Created/Modified

### New Files (3)
- `app/lib/session.ts` — Token generation and verification
- `app/lib/auth-middleware.ts` — Auth validation middleware
- `app/api/auth/login/route.ts` — HTTP-only cookie login endpoint
- `middleware.ts` — CORS protection

### Modified Files (7)
- `app/api/auth/route.ts` — Keep for backward compatibility
- `app/api/design/sessions/[id]/route.ts` — Add sessionToken validation
- `app/api/design/sessions/[id]/options/route.ts` — Add sessionToken validation
- `app/api/design/sessions/[id]/votes/route.ts` — Add sessionToken validation
- `app/api/design/sessions/[id]/comments/route.ts` — Add sessionToken validation
- `hooks/use-admin.ts` — Remove password storage
- `lib/design-api.ts` — Remove adminPassword from API calls
- `next.config.ts` — Add security headers

## Security Improvements

| Vulnerability | Before | After |
|---------------|--------|-------|
| Password in localStorage | ✗ Visible in DevTools | ✓ HTTP-only cookie (JS-inaccessible) |
| Password in request body | ✗ Visible in Network tab | ✓ Token in cookie header (auto-sent) |
| Token expiry | ✗ Never (password stored indefinitely) | ✓ 1 hour server-side enforcement |
| CORS protection | ✗ Any origin can access API | ✓ Same-origin only |
| API security headers | ✗ None | ✓ X-Content-Type-Options, X-Frame-Options, Referrer-Policy |

## Dependencies

### No New Dependencies Required
All functionality uses Next.js built-ins:
- `NextRequest`, `NextResponse`, `NextMiddleware` — Next.js framework
- `crypto.getRandomValues` — Browser Web Crypto API (built-in)
- `Node.js crypto` — Built-in for server-side token generation

### Existing Dependencies Sufficient
- `next` (already v16.1.6)
- React hooks (already v19)

## Backward Compatibility

**Migration Period:**
- Old `/api/auth` endpoint kept (logs deprecation warning)
- API routes accept both creatorToken (old way) and sessionToken (new way)
- Old client code continues to work until Wave 4 updates happen

**Clean Migration Path:**
1. Wave 1-3: Infrastructure ready, old code still works
2. Wave 4: Client code updated to use new auth
3. Future: Remove creatorToken/adminPassword fallbacks

## Testing Strategy

### Automated Verification (Each Wave)
- Token generation produces unique hex-encoded strings
- Token expiry validation works (1-hour max age)
- Middleware correctly rejects unauthorized requests
- Middleware correctly allows authorized requests
- CORS headers present in responses
- Security headers prevent common attacks

### Manual Verification (Recommended)
1. Log in with password → verify HTTP-only cookie set (DevTools → Application → Cookies)
2. Open DevTools console → verify `sessionToken` NOT accessible from JS
3. Attempt cross-origin request → verify 403 Forbidden response
4. Create/edit session → verify sessionToken used (Network tab shows cookie, not password)

## Risk Assessment & Rollback

### Low Risk
This phase has **minimal production impact**:
- Session token is local in-memory Map (no database change)
- HTTP-only cookies are browser standard (all modern browsers support)
- CORS headers are additive (don't break existing same-origin clients)
- Backward compat maintained until Wave 4

### Rollback Strategy (if needed)
1. Revert middleware.ts (restore default CORS)
2. Revert auth-middleware.ts (routes no longer check sessionToken)
3. Revert design-api.ts changes (re-add adminPassword to requests)
4. Users re-authenticate via old /api/auth flow
5. System returns to pre-security state

### Production Readiness
- No database migration required
- No environment variables required for basic functionality
- Session storage upgradeable to database/Redis later without API changes
- Full session expiry and token rotation possible (future enhancements)

## Next Phase Considerations

After Phase 1 completes, Phase 2 could add:
- Persistent session storage (database instead of in-memory Map)
- Session refresh tokens (separate short-lived + long-lived tokens)
- Session revocation/logout endpoint
- Multi-factor authentication (2FA)
- Session activity logging and audit trails

## Success Criteria (Phase Complete When)

- [ ] All 5 plans executed successfully (no errors)
- [ ] Zero passwords visible in browser localStorage
- [ ] Zero passwords in network request bodies (DevTools Network tab)
- [ ] Existing admin functionality still works
- [ ] HTTP-only cookie visible in DevTools (marked "HttpOnly")
- [ ] Cross-origin requests blocked (CORS middleware)
- [ ] All API responses include security headers
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server starts without errors (`npm run dev`)
- [ ] Manual smoke test: Login, edit session, verify token in cookies

## Execution Commands (for reference)

```bash
# Run entire phase
/gsd:execute-phase 01-security-foundation

# Run specific wave
/gsd:execute-phase 01-security-foundation --wave 1
/gsd:execute-phase 01-security-foundation --wave 2
# etc...

# Run specific plan
/gsd:execute-phase 01-security-foundation --plan 01
/gsd:execute-phase 01-security-foundation --plan 02
# etc...
```

## Key Technical Details

### Session Token Format
- **Type:** Cryptographically secure random bytes
- **Encoding:** Hexadecimal string
- **Length:** 64 characters (32 bytes → 2 hex chars per byte)
- **Example:** `a1b2c3d4e5f6... (64 chars total)`

### HTTP-Only Cookie Attributes
- **httpOnly:** true — Not accessible from JavaScript
- **secure:** true (production), false (dev) — HTTPS only in production
- **sameSite:** strict — Not sent with cross-site requests
- **maxAge:** 3600 seconds (1 hour)
- **path:** "/" — Available on entire site

### CORS Allowed Origins (Development)
- `http://localhost:3500` (design-tools dev)
- `http://localhost:3456` (alfredo-studio dev, if co-hosted)
- `https://{VERCEL_URL}` (production deployment)

## Support & Questions

Each plan includes:
- `<objective>` — What and why
- `<context>` — Background and migration strategy
- `<tasks>` — Specific implementation steps
- `<verify>` — Automated test commands
- `<success_criteria>` — Measurable completion
- `<output>` — Summary artifact location
