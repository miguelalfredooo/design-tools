---
phase: 01-security-foundation
plan: 04
subsystem: Client Auth & API Security
tags: [auth, localStorage, http-only-cookies, credential-removal]
dependency_graph:
  requires: [02, 03]
  provides: [05]
  affects: [auth-flow, api-calls, session-management]
tech_stack:
  patterns: [http-only-cookies, sessionToken-validation, credentials-include]
  added: []
  dependencies: []
key_files:
  created: []
  modified:
    - hooks/use-admin.ts
    - lib/design-api.ts
decisions:
  - "useAdmin hook now calls /api/auth/login for HTTP-only cookie auth"
  - "sessionToken stored in HTTP-only cookie, not accessible to JS"
  - "All admin API calls include credentials: 'include' for cookie handling"
  - "Creator tokens still use localStorage (different from admin password)"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_modified: 2
  commits: 1
---

# Phase 01 Plan 04: Remove localStorage Credential Storage Summary

**Objective:** Migrate admin authentication from password-in-localStorage to HTTP-only session token cookies. Eliminate credentials from client storage and network requests.

## What Was Done

### Task 1: Update `hooks/use-admin.ts`
- **Removed:** `ADMIN_PASSWORD_KEY` constant
- **Removed:** `getAdminPassword()` function entirely
- **Updated:** `login()` callback to call `/api/auth/login` instead of `/api/auth`
- **Added:** `credentials: 'include'` to fetch options to preserve HTTP-only cookie behavior
- **Kept:** `isAdminMode()` function and `ADMIN_FLAG_KEY` (tracks login state without storing credentials)
- **Kept:** `logout()` function structure (now only removes admin flag)

### Task 2: Remove adminPassword from all API calls in `lib/design-api.ts`
- **Removed:** `import { getAdminPassword } from "@/hooks/use-admin"`
- **Removed:** `adminPassword: getAdminPassword()` from all 7 affected functions:
  - `apiUpdateSession()`
  - `apiDeleteSession()`
  - `apiAddOption()`
  - `apiUpdateOption()`
  - `apiRemoveOption()`
  - `apiDeleteSpatialComment()`
  - `apiDeleteSpatialCommentAsCreator()`
  - `apiPinVote()`
- **Added:** `credentials: 'include'` to all admin API calls to ensure sessionToken cookie is included automatically

## Architecture Changes

**Before (Insecure):**
1. User submits password → stored in localStorage as ADMIN_PASSWORD_KEY
2. Every admin API call reads password via getAdminPassword()
3. Password transmitted in request body: `{ adminPassword: "...", ... }`
4. Server validates password inline
5. Client-side: password visible to any script with access to localStorage

**After (Secure):**
1. User submits password → POST /api/auth/login
2. Server validates password, creates sessionToken (Wave 2)
3. Server sets HTTP-only cookie with sessionToken (immune to XSS)
4. Browser automatically includes cookie in all subsequent requests
5. All admin API calls rely on sessionToken validation (Wave 3)
6. Client-side: no credentials stored or transmitted in request bodies

## Verification Results

✅ **Task 1 Checks:**
- `getAdminPassword()` function removed (no matches found)
- `ADMIN_PASSWORD_KEY` constant removed (no matches found)
- Login endpoint changed to `/api/auth/login` (verified in code)
- No password stored in localStorage (verified)
- Exports still present: `isAdminMode()` and `useAdmin()` (2 exports found)

✅ **Task 2 Checks:**
- `getAdminPassword` import removed (no matches found)
- `adminPassword:` properties removed (no matches found)
- `creatorToken` still present in API calls (17 occurrences, unchanged)
- All 8 functions updated with `credentials: 'include'`

## Deviations from Plan

None - plan executed exactly as written. No auto-fixes required. No architectural decisions needed.

## What's Next

**Wave 5:** Implement CORS and security headers for the /api/auth/login endpoint to prevent unauthorized access from malicious origins.

**Wave 3 Dependency:** The API routes (already implemented) validate `sessionToken` from cookies via `withAuth` middleware. This plan completes the client-side half of the secure flow.

## Self-Check Results

✅ **Files Modified:** `hooks/use-admin.ts`, `lib/design-api.ts`
✅ **Commit Hash:** `28f8c0e`
✅ **Verification:** All 4 Task 1 checks passed, all 3 Task 2 checks passed

## Security Impact

- **Before:** Passwords visible in localStorage (XSS exposure) and in request bodies (network inspection)
- **After:** Passwords never stored on client. Session tokens in HTTP-only cookies (XSS-safe). Network requests contain no credentials.
- **Additional Protection Required:** CORS + security headers (Wave 5) to prevent token theft from malicious origins.

## Summary

This plan successfully removes all localStorage credential storage and replaces it with HTTP-only session token cookies. The client code now flows passwords only to the /api/auth/login endpoint and never stores them. All admin operations use the session token automatically included by the browser, making credentials invisible to client-side scripts and request inspectors.

The implementation is atomic and ready for Wave 5 (CORS + security headers).
