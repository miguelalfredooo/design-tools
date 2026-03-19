---
phase: 01-security-foundation
plan: 04
type: execute
wave: 4
depends_on: [02, 03]
files_modified:
  - hooks/use-admin.ts
  - lib/design-api.ts
autonomous: true
requirements: [SEC-01, SEC-04]
must_haves:
  truths:
    - "Admin auth no longer stores password in localStorage"
    - "useAdmin hook calls /api/auth/login instead of /api/auth"
    - "Session token auto-included in fetch requests (browser cookie behavior)"
    - "Admin login flow: user submits password → /api/auth/login → sets HTTP-only cookie → client doesn't see token"
    - "Creator tokens still stored in localStorage (different from admin password)"
    - "API calls no longer send adminPassword in request body"
  artifacts:
    - path: "hooks/use-admin.ts"
      provides: "Admin auth hook without localStorage password storage"
      exports: ["useAdmin", "isAdminMode"]
    - path: "lib/design-api.ts"
      provides: "Creator token management (unchanged) and API calls without adminPassword"
      exports: ["apiCreateSession", "apiUpdateSession", "apiDeleteSession", "apiAddOption", "apiUpdateOption", "apiRemoveOption", "apiPinVote"]
  key_links:
    - from: "hooks/use-admin.ts"
      to: "app/api/auth/login/route.ts"
      via: "fetch POST /api/auth/login"
      pattern: "fetch.*api/auth/login"
    - from: "design-api.ts"
      to: "API routes"
      via: "No adminPassword in request body"
      pattern: "JSON.stringify.*creatorToken"
---

<objective>
Remove client-side password storage from useAdmin hook. Eliminate adminPassword from all API calls in design-api.ts. Migrate admin auth to HTTP-only session token flow.

Purpose: Admin authentication now flows through HTTP-only cookies set by /api/auth/login, not request body strings.

Output: Updated useAdmin hook and design-api.ts that stop exposing credentials over the network.
</objective>

<execution_context>
@/Users/miguelarias/Code/design-tools/hooks/use-admin.ts (current admin auth with localStorage password)
@/Users/miguelarias/Code/design-tools/lib/design-api.ts (API calls that pass adminPassword via getAdminPassword)
@/Users/miguelarias/Code/design-tools/.planning/01-security-foundation/01-security-foundation-02-PLAN.md (New /api/auth/login endpoint)
@/Users/miguelarias/Code/design-tools/.planning/01-security-foundation/01-security-foundation-03-PLAN.md (Protected routes validating sessionToken from cookies)
</execution_context>

<context>
Current credential flow (INSECURE):
1. User submits password in admin UI
2. useAdmin calls POST /api/auth
3. Server returns { ok: true }
4. Client stores password in localStorage
5. design-api.ts reads password via getAdminPassword()
6. Every admin API call includes password in body: { ..., adminPassword: password }

New credential flow (SECURE):
1. User submits password in admin UI
2. useAdmin calls POST /api/auth/login
3. Server validates password, creates sessionToken, returns HTTP-only cookie
4. Browser stores sessionToken in cookie (client JS cannot access)
5. design-api.ts does NOT read or send password
6. Every fetch request automatically includes sessionToken cookie (browser behavior)
7. Server validates token in middleware (Routes check cookies in Wave 3)

Key changes:
- Remove getAdminPassword import from design-api.ts
- Remove adminPassword from all JSON.stringify() calls
- Session token is handled transparently by browser cookies
</context>

<tasks>

<task type="auto">
  <name>Task 9: Update useAdmin hook to use /api/auth/login (no localStorage password)</name>
  <files>hooks/use-admin.ts</files>
  <action>
Replace admin password storage with HTTP-only cookie flow.

Current hook stores password in localStorage. Replace with token-based flow:

1. Remove ADMIN_PASSWORD_KEY constant
2. Remove getAdminPassword() function completely
3. In login() callback:
   - Change fetch URL from "/api/auth" to "/api/auth/login"
   - Remove lines that store password in localStorage
   - Keep line that sets ADMIN_FLAG_KEY = "1" (tracks "user is logged in")
4. Keep isAdminMode() function unchanged
5. Keep useAdmin() hook structure unchanged
6. Keep logout() function unchanged

Before (conceptual):
```typescript
const ADMIN_PASSWORD_KEY = "design-admin-password";
export function getAdminPassword(): string | null {
  return localStorage.getItem(ADMIN_PASSWORD_KEY);
}
const login = useCallback(async (password: string): Promise<boolean> => {
  const res = await fetch("/api/auth", { ... });
  if (!res.ok) return false;
  localStorage.setItem(ADMIN_PASSWORD_KEY, password);  // REMOVE THIS
  localStorage.setItem(ADMIN_FLAG_KEY, "1");
  return true;
}, []);
```

After:
```typescript
// ADMIN_PASSWORD_KEY REMOVED
// getAdminPassword() REMOVED
const login = useCallback(async (password: string): Promise<boolean> => {
  const res = await fetch("/api/auth/login", { ... });  // CHANGED URL
  if (!res.ok) return false;
  localStorage.setItem(ADMIN_FLAG_KEY, "1");  // Password NOT stored
  return true;
}, []);
```

The sessionToken cookie is managed automatically by the browser (Set-Cookie header).
  </action>
  <verify>
    <automated>
Test 1: Verify getAdminPassword removed
```bash
grep -n "getAdminPassword\|ADMIN_PASSWORD_KEY" /Users/miguelarias/Code/design-tools/hooks/use-admin.ts
```
Should return no matches.

Test 2: Verify login calls /api/auth/login
```bash
grep -n "api/auth/login" /Users/miguelarias/Code/design-tools/hooks/use-admin.ts
```
Should show at least one match in login callback.

Test 3: Verify no password in localStorage
```bash
grep -n "localStorage.setItem.*password" /Users/miguelarias/Code/design-tools/hooks/use-admin.ts
```
Should return no matches.

Test 4: File still exports isAdminMode and useAdmin
```bash
grep -n "export.*isAdminMode\|export.*useAdmin" /Users/miguelarias/Code/design-tools/hooks/use-admin.ts
```
Should show 2 exports.
    </automated>
  </verify>
  <done>
- useAdmin hook updated to call /api/auth/login
- Admin password NOT stored in localStorage anymore
- getAdminPassword() function completely removed
- isAdminMode() flag still used to track login state (no password stored in it)
- Browser manages sessionToken cookie automatically
- Hook structure preserved for React compatibility
  </done>
</task>

<task type="auto">
  <name>Task 10: Remove adminPassword from all API calls in design-api.ts</name>
  <files>lib/design-api.ts</files>
  <action>
Stop passing adminPassword in API request bodies. Session token will be sent via cookies automatically by the browser.

Current implementation imports getAdminPassword and includes it in many API calls:

Find all instances of:
- `getAdminPassword()` → remove import and all calls
- `adminPassword: getAdminPassword()` → remove this property from request bodies
- Lines like `JSON.stringify({ creatorToken, adminPassword: getAdminPassword(), ... })` → remove adminPassword prop

Functions affected (examples from file):
- apiUpdateSession() — removes adminPassword from body
- apiDeleteSession() — removes adminPassword from body
- apiAddOption() — removes adminPassword from body
- apiUpdateOption() — removes adminPassword from body
- apiRemoveOption() — removes adminPassword from body
- apiPinVote() — removes adminPassword from body
- apiDeleteSpatialComment() — removes adminPassword from body
- apiDeleteSpatialCommentAsCreator() — removes adminPassword from body

Pattern:

Before:
```typescript
export async function apiUpdateSession(
  id: string,
  creatorToken: string,
  updates: { phase?: string; participantCount?: number }
) {
  return api<{ ok: true }>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ creatorToken, adminPassword: getAdminPassword(), ...updates }),
  });
}
```

After:
```typescript
export async function apiUpdateSession(
  id: string,
  creatorToken: string,
  updates: { phase?: string; participantCount?: number }
) {
  return api<{ ok: true }>(`${BASE}/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ creatorToken, ...updates }),  // adminPassword REMOVED
  });
}
```

Do this for ALL functions that pass adminPassword.

Remove line: `import { getAdminPassword } from "@/hooks/use-admin";`

The sessionToken will be sent automatically in the Cookie header by the browser.
  </action>
  <verify>
    <automated>
Test 1: Verify getAdminPassword import removed
```bash
grep -n "getAdminPassword\|use-admin" /Users/miguelarias/Code/design-tools/lib/design-api.ts
```
Should return no matches (import and all references removed).

Test 2: Verify adminPassword removed from request bodies
```bash
grep -n "adminPassword:" /Users/miguelarias/Code/design-tools/lib/design-api.ts
```
Should return no matches.

Test 3: Verify creatorToken still present
```bash
grep -n "creatorToken" /Users/miguelarias/Code/design-tools/lib/design-api.ts
```
Should still show matches (creatorToken NOT removed, only adminPassword removed).

Test 4: Line count check (rough validation)
```bash
wc -l /Users/miguelarias/Code/design-tools/lib/design-api.ts
```
Should be roughly 190-200 lines (original was 214, removed imports + adminPassword refs = ~10-20 lines).
    </automated>
  </verify>
  <done>
- design-api.ts no longer imports getAdminPassword
- All adminPassword properties removed from JSON.stringify() calls
- creatorToken still present in API calls (unchanged)
- Session token automatically sent via browser Cookie header
- All admin operations now rely on sessionToken validation (server-side, Wave 3)
- File ready for production use
  </done>
</task>

</tasks>

<verification>
After both tasks complete:
1. useAdmin hook no longer stores password in localStorage
2. All API calls no longer pass adminPassword in request body
3. Admin auth now flows through /api/auth/login → HTTP-only cookie → browser automatic include
4. design-api.ts has no references to getAdminPassword
5. All protected routes (Wave 3) validate sessionToken from cookies
6. Credentials eliminated from client-side storage and network transmission
</verification>

<success_criteria>
- No passwords stored in browser localStorage
- No adminPassword strings in API request bodies
- useAdmin hook calls /api/auth/login endpoint
- design-api.ts imports from @/hooks/use-admin are removed
- All admin operations still work via sessionToken in cookies
- Creator tokens (per-session UUIDs) still work as before
- No breaking changes to public API interfaces
</success_criteria>

<output>
After execution, create `.planning/01-security-foundation/01-security-foundation-04-SUMMARY.md` with:
- Updated files: hooks/use-admin.ts, lib/design-api.ts
- Removed functions: getAdminPassword
- Removed constants: ADMIN_PASSWORD_KEY
- Removed import: getAdminPassword from design-api.ts
- New endpoint used: POST /api/auth/login (returns HTTP-only cookie)
- Result: Zero passwords in localStorage, zero passwords in network requests
</output>
