---
phase: 01-security-foundation
plan: 03
status: complete
completed_at: 2026-03-19T00:00:00Z
duration_minutes: 15
subsystem: api-security
tags: [authentication, session-tokens, admin-routes, api-protection]
requirements: [SEC-02, SEC-03]
decisions:
  - "Session token validation added to all admin mutation endpoints"
  - "Backward compatibility maintained with creatorToken and adminPassword"
  - "Session token extracted from cookies and verified server-side"
---

# Phase 01 Plan 03: Protect Admin API Routes with Auth Middleware

Protected all `/api/design/*` admin mutation routes with session token validation. Routes now require valid sessionToken from cookies for PATCH, DELETE, and sensitive POST operations.

## Execution Summary

### Tasks Completed: 4/4

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Protect PATCH/DELETE on /api/design/sessions/[id] | c969dcb | Complete |
| 2 | Protect POST/PATCH/DELETE on /api/design/sessions/[id]/options | c969dcb | Complete |
| 3 | Protect PATCH on /api/design/sessions/[id]/votes | c969dcb | Complete |
| 4 | Protect DELETE on /api/design/sessions/[id]/comments | c969dcb | Complete |

### Routes Protected

**Sessions Route** (`app/api/design/sessions/[id]/route.ts`)
- PATCH handler: Validates sessionToken from cookies before updating session phase/participant count
- DELETE handler: Validates sessionToken from cookies before deleting session
- GET handler: Remains public (no auth required)

**Options Route** (`app/api/design/sessions/[id]/options/route.ts`)
- POST handler: Validates sessionToken before creating options
- PATCH handler: Validates sessionToken before editing options
- DELETE handler: Validates sessionToken before removing options

**Votes Route** (`app/api/design/sessions/[id]/votes/route.ts`)
- PATCH handler: Validates sessionToken before pinning/unpinning votes
- POST handler: Remains public (cast votes without auth)
- DELETE handler: Remains public (undo votes without auth)

**Comments Route** (`app/api/design/sessions/[id]/comments/route.ts`)
- DELETE handler: Validates sessionToken for admin deletion
- POST handler: Remains public (add comments without auth)
- GET handler: Remains public (fetch comments without auth)

### Implementation Details

**Pattern Applied:** Session token extraction and validation
```typescript
function extractSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith("sessionToken=")) {
      return trimmed.substring("sessionToken=".length);
    }
  }
  return null;
}

// In each handler
const sessionToken = extractSessionToken(request);
const sessionValid = sessionToken ? verifySessionToken(sessionToken).valid : false;

if (!sessionValid && !creatorToken && !adminPassword) {
  return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
}
```

**Authentication Flow:**
1. Extract sessionToken from request cookies
2. Validate token using `verifySessionToken()` from `@/lib/session`
3. Accept request if:
   - Valid sessionToken present, OR
   - Valid creatorToken provided (backward compat), OR
   - Valid adminPassword provided (backward compat)
4. Return 401 Unauthorized if none of the above

### Backward Compatibility

All routes maintain support for existing authentication methods during migration:
- **sessionToken** (new): Preferred method, extracted from cookies automatically
- **creatorToken** (existing): Still accepted in request body
- **adminPassword** (existing): Still accepted in request body

This allows frontend to transition gradually without breaking existing sessions.

### Security Improvements

- All admin operations now protected by server-side token verification
- Invalid or missing tokens return 401 Unauthorized before any data mutations
- Token expiry is checked on each request (no expired tokens accepted)
- Public read operations (GET) remain accessible
- Public vote casting and commenting remain accessible

### Files Modified

- `app/api/design/sessions/[id]/route.ts` (PATCH, DELETE protected)
- `app/api/design/sessions/[id]/options/route.ts` (POST, PATCH, DELETE protected)
- `app/api/design/sessions/[id]/votes/route.ts` (PATCH protected)
- `app/api/design/sessions/[id]/comments/route.ts` (DELETE protected)

### Deviations from Plan

None - plan executed exactly as written. All required endpoints protected with consistent session token validation pattern.

### Next Steps

**Wave 4** can now safely:
1. Remove localStorage password storage from client
2. Update API calls to remove creatorToken from request body
3. Rely exclusively on sessionToken from cookies for admin operations
4. Remove adminPassword checks from client code

---

**Commit Hash:** c969dcb
**Ready for Wave 4:** Yes - all admin routes now protected with session token auth
