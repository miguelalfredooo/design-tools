---
phase: 01-security-foundation
plan: 03
type: execute
wave: 3
depends_on: [01, 02]
files_modified:
  - app/api/design/sessions/[id]/route.ts
  - app/api/design/sessions/[id]/options/route.ts
  - app/api/design/sessions/[id]/votes/route.ts
  - app/api/design/sessions/[id]/comments/route.ts
  - app/api/design/sessions/[id]/reactions/route.ts
autonomous: true
requirements: [SEC-02, SEC-03]
must_haves:
  truths:
    - "Protected routes verify sessionToken from cookies before executing"
    - "Routes without valid sessionToken return 401 Unauthorized"
    - "Routes with valid sessionToken execute normally"
    - "Token expiry is checked on each request (no expired tokens accepted)"
    - "Admin operations (phase changes, option edits) require valid session token"
  artifacts:
    - path: "app/api/design/sessions/[id]/route.ts"
      provides: "PATCH/DELETE handlers protected by auth middleware"
      contains: "withAuth\|validateSessionToken"
    - path: "app/api/design/sessions/[id]/options/route.ts"
      provides: "POST/PATCH/DELETE handlers protected by auth middleware"
      contains: "withAuth\|validateSessionToken"
    - path: "app/api/design/sessions/[id]/votes/route.ts"
      provides: "PATCH handler protected by auth middleware"
      contains: "withAuth\|validateSessionToken"
    - path: "app/api/design/sessions/[id]/comments/route.ts"
      provides: "DELETE handler protected by auth middleware"
      contains: "withAuth\|validateSessionToken"
    - path: "app/api/design/sessions/[id]/reactions/route.ts"
      provides: "No admin auth needed (public reactions)"
      status: "unchanged"
  key_links:
    - from: "app/api/design/sessions/[id]/route.ts"
      to: "app/lib/auth-middleware.ts"
      via: "PATCH/DELETE wrapped with withAuth"
      pattern: "withAuth.*PATCH|withAuth.*DELETE"
    - from: "app/api/design/sessions/[id]/options/route.ts"
      to: "app/lib/auth-middleware.ts"
      via: "POST/PATCH/DELETE wrapped with withAuth"
      pattern: "withAuth.*POST|withAuth.*PATCH|withAuth.*DELETE"
    - from: "design-store.tsx getCreatorToken()"
      to: "app/api/design/* routes"
      via: "sessionToken cookie (automatic via fetch)"
      pattern: "fetch.*sessionToken.*cookie"
---

<objective>
Apply auth middleware to all protected API routes. Require valid sessionToken in cookies for admin operations (session updates, option management, vote pinning, comment deletion).

Purpose: Enforce server-side authentication on all admin operations. Invalid or missing tokens return 401, preventing unauthorized modifications.

Output: Protected routes that validate sessionToken via middleware before executing handlers.
</objective>

<execution_context>
@/Users/miguelarias/Code/design-tools/app/api/design/sessions/[id]/route.ts (current PATCH/DELETE handlers)
@/Users/miguelarias/Code/design-tools/app/api/design/sessions/[id]/options/route.ts (current POST/PATCH/DELETE handlers)
@/Users/miguelarias/Code/design-tools/.planning/01-security-foundation/01-security-foundation-01-PLAN.md (Auth middleware from Wave 1)
@/Users/miguelarias/Code/design-tools/.planning/01-security-foundation/01-security-foundation-02-PLAN.md (Login endpoint from Wave 2)
</execution_context>

<context>
Routes to protect (admin-only operations):
1. PATCH /api/design/sessions/[id] — update phase, participant count (requires admin or creator token)
2. DELETE /api/design/sessions/[id] — delete session (requires admin or creator token)
3. POST /api/design/sessions/[id]/options — add option (requires admin or creator token)
4. PATCH /api/design/sessions/[id]/options — edit option (requires admin or creator token)
5. DELETE /api/design/sessions/[id]/options — remove option (requires admin or creator token)
6. PATCH /api/design/sessions/[id]/votes — pin/unpin vote comment (requires admin or creator token)
7. DELETE /api/design/sessions/[id]/comments — delete spatial comment (requires admin only)

Routes to leave public (no auth required):
- GET /api/design/sessions/[id] — view session (public)
- POST /api/design/sessions/[id]/votes — cast vote (public)
- DELETE /api/design/sessions/[id]/votes — undo vote (public, voter_id check only)
- POST /api/design/sessions/[id]/reactions — toggle reaction (public)
- GET /api/design/sessions/[id]/reactions — get reactions (public)
- POST /api/design/sessions/[id]/comments — add comment (public)
- GET /api/design/sessions/[id]/comments — get comments (public)

Migration strategy:
- Update handlers to still accept creatorToken (for backward compat) OR validate sessionToken
- In next wave, remove creatorToken/adminPassword from client-side API calls
</context>

<tasks>

<task type="auto">
  <name>Task 5: Protect PATCH and DELETE on /api/design/sessions/[id]</name>
  <files>app/api/design/sessions/[id]/route.ts</files>
  <action>
Update the PATCH and DELETE handlers to validate sessionToken via middleware.

Current code structure:
- GET (public, unchanged)
- PATCH (admin operation, currently checks adminPassword string)
- DELETE (admin operation, currently checks adminPassword string)

Modify both PATCH and DELETE handlers:

1. Keep the existing logic for checking creatorToken (for backward compat during migration)
2. Add sessionToken validation at the start of each handler
3. If sessionToken valid: bypass creatorToken check (admin has access to all sessions)
4. If sessionToken invalid AND no creatorToken: return 401

Pattern:

```typescript
import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { creatorToken, adminPassword, phase, participantCount } = body;

  // Extract sessionToken from cookies
  const cookies = request.headers.get("cookie") || "";
  const sessionTokenMatch = cookies.match(/sessionToken=([^;]+)/);
  const sessionToken = sessionTokenMatch?.[1];

  // Check for valid sessionToken (preferred method going forward)
  const sessionValid = sessionToken ? verifySessionToken(sessionToken).valid : false;

  // Fallback to creatorToken or adminPassword for backward compat
  if (!sessionValid && !creatorToken && !adminPassword) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  // If sessionToken valid, admin has full access (skip creatorToken check below)
  const isAdmin = sessionValid || isValidAdmin(adminPassword);

  // Rest of handler continues as before...
  // ...existing validation and update logic...
}
```

Apply same pattern to DELETE handler.

Note: isValidAdmin function already exists in this file. Import verifySessionToken from @/lib/session.
  </action>
  <verify>
    <automated>
Test 1: PATCH with valid sessionToken in cookie
```bash
curl -X PATCH http://localhost:3500/api/design/sessions/test-id \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<valid_token_from_login>" \
  -d '{"phase":"voting"}' \
  -i
```
Should return 200 (or expected session update response).

Test 2: PATCH without sessionToken and no creatorToken
```bash
curl -X PATCH http://localhost:3500/api/design/sessions/test-id \
  -H "Content-Type: application/json" \
  -d '{"phase":"voting"}' \
  -i
```
Should return 401 "Missing authorization".

Test 3: Verify code includes sessionToken validation
```bash
grep -n "sessionToken\|verifySessionToken" /Users/miguelarias/Code/design-tools/app/api/design/sessions/\[id\]/route.ts | head -5
```
    </automated>
  </verify>
  <done>
- PATCH handler checks sessionToken from cookies first
- DELETE handler checks sessionToken from cookies first
- Both handlers maintain backward compat with creatorToken
- Invalid/missing auth returns 401
- Sessions can be updated/deleted by users with valid sessionToken
  </done>
</task>

<task type="auto">
  <name>Task 6: Protect POST, PATCH, DELETE on /api/design/sessions/[id]/options</name>
  <files>app/api/design/sessions/[id]/options/route.ts</files>
  <action>
Update option handlers (POST, PATCH, DELETE) to validate sessionToken.

File structure has handlers for all three methods. Modify each to check sessionToken similarly:

1. Extract sessionToken from cookies at handler start
2. Validate token via verifySessionToken
3. Check authorization: sessionToken valid → admin access, OR creatorToken matches, OR adminPassword valid
4. Return 401 if none of above

Apply the same cookie parsing pattern as Task 5:
```typescript
const cookies = request.headers.get("cookie") || "";
const sessionTokenMatch = cookies.match(/sessionToken=([^;]+)/);
const sessionToken = sessionTokenMatch?.[1];
const sessionValid = sessionToken ? verifySessionToken(sessionToken).valid : false;
```

Modify all three methods (POST, PATCH, DELETE) in this file to use this pattern.

The isValidAdmin function already exists in this file.
  </action>
  <verify>
    <automated>
Test POST with valid sessionToken:
```bash
curl -X POST http://localhost:3500/api/design/sessions/test-id/options \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<valid_token>" \
  -d '{"title":"New Option","description":"Description"}' \
  -i
```

Test DELETE without sessionToken:
```bash
curl -X DELETE http://localhost:3500/api/design/sessions/test-id/options \
  -H "Content-Type: application/json" \
  -d '{"optionId":"opt-1"}' \
  -i
```
Should return 401.

Verify sessionToken extraction in code:
```bash
grep -c "sessionToken\|verifySessionToken" /Users/miguelarias/Code/design-tools/app/api/design/sessions/\[id\]/options/route.ts
```
Should show multiple matches (one per method).
    </automated>
  </verify>
  <done>
- POST /api/design/sessions/[id]/options checks sessionToken
- PATCH /api/design/sessions/[id]/options checks sessionToken
- DELETE /api/design/sessions/[id]/options checks sessionToken
- All three methods accept valid sessionToken as authorization
- Backward compat maintained for creatorToken and adminPassword
  </done>
</task>

<task type="auto">
  <name>Task 7: Protect PATCH on /api/design/sessions/[id]/votes</name>
  <files>app/api/design/sessions/[id]/votes/route.ts</files>
  <action>
Update the PATCH handler (pin/unpin vote) to validate sessionToken.

Read the file first. It should have POST (cast vote - public) and PATCH (pin vote - admin) handlers.

Only modify PATCH handler. POST remains public (no auth required).

PATCH handler change:
1. Extract sessionToken from cookies
2. Validate via verifySessionToken
3. Check authorization: sessionToken valid → allow, OR creatorToken matches, OR adminPassword valid
4. Return 401 if none above

Pattern is identical to Tasks 5 and 6.

GET and DELETE handlers may also exist — check file. If DELETE exists and is public (undo vote), leave it unchanged.
  </action>
  <verify>
    <automated>
Test PATCH (pin vote) with valid sessionToken:
```bash
curl -X PATCH http://localhost:3500/api/design/sessions/test-id/votes \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<valid_token>" \
  -d '{"voteId":"vote-1","pinned":true}' \
  -i
```

Test POST (cast vote) without auth — should still work:
```bash
curl -X POST http://localhost:3500/api/design/sessions/test-id/votes \
  -H "Content-Type: application/json" \
  -d '{"optionId":"opt-1","voterId":"voter-1","voterName":"Alice"}' \
  -i
```
Should NOT require sessionToken.
    </automated>
  </verify>
  <done>
- PATCH /api/design/sessions/[id]/votes checks sessionToken
- POST (cast vote) remains public (no auth required)
- DELETE (undo vote) remains public (voter_id check only)
  </done>
</task>

<task type="auto">
  <name>Task 8: Protect DELETE on /api/design/sessions/[id]/comments</name>
  <files>app/api/design/sessions/[id]/comments/route.ts</files>
  <action>
Update DELETE handler (delete spatial comment) to validate sessionToken.

File should have GET (public), POST (public - add comment), DELETE (admin only).

Only modify DELETE handler. GET and POST remain public.

DELETE handler change:
1. Extract sessionToken from cookies
2. Validate via verifySessionToken
3. Check authorization: sessionToken valid → allow, OR creatorToken matches (for creator-only comment deletion)
4. Return 401 if auth fails

Note: This endpoint currently checks if user is creator of comment OR admin (via adminPassword). SessionToken should grant admin access to all comments.
  </action>
  <verify>
    <automated>
Test DELETE with valid sessionToken:
```bash
curl -X DELETE http://localhost:3500/api/design/sessions/test-id/comments \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionToken=<valid_token>" \
  -d '{"commentId":"comment-1"}' \
  -i
```

Test POST (add comment) without auth — should still work:
```bash
curl -X POST http://localhost:3500/api/design/sessions/test-id/comments \
  -H "Content-Type: application/json" \
  -d '{"optionId":"opt-1","voterId":"voter-1","voterName":"Alice","body":"Comment","xPct":50,"yPct":50}' \
  -i
```
Should NOT require sessionToken.
    </automated>
  </verify>
  <done>
- DELETE /api/design/sessions/[id]/comments checks sessionToken
- POST (add comment) remains public
- GET (fetch comments) remains public
  </done>
</task>

</tasks>

<verification>
After all tasks complete:
1. All protected routes (PATCH, DELETE on sessions; POST/PATCH/DELETE on options; PATCH on votes; DELETE on comments) validate sessionToken
2. Valid sessionToken in cookie grants admin access
3. Missing/invalid tokens return 401
4. Public routes (GET, public POST) remain unchanged
5. Backward compat maintained (creatorToken/adminPassword still accepted)
6. Next wave can remove client-side credentials
</verification>

<success_criteria>
- All admin-only routes check sessionToken from cookies
- Valid sessionToken grants authorization
- Missing/invalid sessionToken returns 401
- Public routes unchanged
- Backward compat maintained during migration
- All 5 protected route files updated with sessionToken validation
</success_criteria>

<output>
After execution, create `.planning/01-security-foundation/01-security-foundation-03-SUMMARY.md` with:
- Routes protected: 5 files, 8 handlers total
- Pattern applied: Extract sessionToken from cookies, verify via verifySessionToken, return 401 if invalid
- Backward compat: creatorToken and adminPassword still accepted (removed in Wave 4)
- Result: All admin operations require valid sessionToken
</output>
