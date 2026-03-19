# Codebase Concerns

**Analysis Date:** 2026-03-19

## Security Issues

### Admin Password Stored in localStorage

**Risk:** Admin credentials are persisted in browser localStorage without encryption, accessible to any script on the page.
- **Files:** `hooks/use-admin.ts`, `lib/design-api.ts`, `app/api/design/sessions/[id]/route.ts`
- **Current Implementation:** `localStorage.setItem(ADMIN_PASSWORD_KEY, password)` at line 58 in `hooks/use-admin.ts`
- **Attack Vector:** XSS vulnerability could compromise admin credentials. localStorage is also accessible to third-party scripts and visible in DevTools.
- **Impact:** An attacker could gain full session modification/deletion capabilities if they can execute scripts in the browser or access DevTools.
- **Recommendation:**
  - Remove password from localStorage. Instead, use HTTP-only cookies set by the auth endpoint.
  - Implement session tokens that expire after a reasonable time (e.g., 1 hour).
  - Add CSRF protection for API mutations.
  - Store only a session token ID in localStorage, never the actual password.

### Creator Tokens in localStorage

**Risk:** Creator tokens are stored in localStorage in plain JSON, allowing any script to hijack sessions.
- **Files:** `lib/design-store.tsx` lines 36-58
- **Current Implementation:** `localStorage.setItem(CREATOR_TOKENS_KEY, JSON.stringify(tokens))`
- **Impact:** Stolen tokens allow full session control (delete, edit, add/remove options).
- **Recommendation:**
  - Use HTTP-only cookies for token storage instead of localStorage.
  - Implement token rotation on session deletion.
  - Add token expiration after 30 days.

### File Upload Without Validation

**Risk:** File uploads lack MIME type and size validation on the server.
- **Files:** `app/api/design/upload/route.ts`
- **Current Issue:** Only `file.type` from client is used; no server-side validation. Extension is extracted from `file.name` split.
- **Attack Vector:** Malicious file uploads, oversized files, or executable files could be stored.
- **Recommendation:**
  - Validate MIME type on server using file content, not client-provided header.
  - Implement file size limits (e.g., max 10MB per file).
  - Whitelist allowed file types (JPEG, PNG, GIF, WebP only).
  - Rename files with server-generated IDs only, ignore user filename.
  - Set Content-Disposition header to `attachment` for all stored files.

### Admin Password Comparison Without Timing Attack Protection

**Risk:** Simple string equality check vulnerable to timing attacks.
- **Files:** `app/api/design/sessions/[id]/options/route.ts` line 6, `app/api/design/sessions/[id]/route.ts` line 59
- **Current Pattern:** `return !!correct && !!adminPassword && adminPassword === correct;`
- **Impact:** Attacker can measure response time to guess password character by character.
- **Recommendation:** Use `crypto.timingSafeEqual()` for password comparison.

### Missing CORS Protection

**Risk:** No explicit CORS headers set; relies on browser defaults, leaving API open to third-party requests.
- **Files:** All API routes in `app/api/design/*`
- **Impact:** POST/PATCH/DELETE requests could be triggered from attacker domains if they can induce a user visit.
- **Recommendation:**
  - Add CORS middleware that only allows same-origin requests.
  - Set `Access-Control-Allow-Origin: {domain}` explicitly.

## Tech Debt & Code Quality

### Oversized Components (Maintainability Risk)

**Large Component Files:**
- `components/design/research-client.tsx` - 2051 lines, 35+ hooks, multiple chart types, insights rendering all mixed
- `lib/design-store.tsx` - 674 lines, complex state management with numerous methods
- `app/replays/page.tsx` - 641 lines, mixes UI rendering with data transformation
- `app/research/observe/page.tsx` - 510 lines
- `app/explorations/[id]/page.tsx` - 459 lines with multiple workflows

**Files:** See line counts above
**Why Fragile:** Changes to one feature require understanding the entire 2000+ line file. Adding new features risks breaking existing logic. Testing individual components is difficult.
**Safe Modification:**
- Extract chart rendering into separate components (one per chart type).
- Split `research-client.tsx` into: `ResearchClientObservations`, `ResearchClientSegments`, `ResearchClientInsights` based on tab functionality.
- Extract theme rendering loops into `ThemeBreakdownCard`, `QuickWinsCard`, `BigBetsCard` components.
- Move data transformation logic from pages into custom hooks (e.g., `useReplaysData()`, `useResearchSynthesis()`).

### Scattered Error Handling

**Problem:** Inconsistent error handling patterns across codebase.
- **Files:**
  - `app/api/design/sessions/route.ts` - validates input, returns structured errors
  - `app/api/design/upload/route.ts` - no file validation, only checks if file exists
  - `lib/ollama.ts` - throws, no retry logic
  - Multiple routes use `.catch(() => {})` to silently swallow errors (fire-and-forget notifications)
- **Risk:** Silent failures mask bugs. Unvalidated user input accepted in some endpoints.
- **Pattern Inconsistency:** Some routes validate, some don't. No centralized error schema.
- **Recommendation:**
  - Create a `lib/api-errors.ts` with standard error types and handlers.
  - Always validate request body schema with Zod in every API route.
  - Log silent catches to a monitoring system instead of swallowing completely.
  - Return consistent error response shape: `{ error: string; code: string; details?: unknown }`

### Missing Request Validation

**Risk:** API routes accept unvalidated user input.
- **Files:**
  - `app/api/design/sessions/[id]/comments/route.ts` - comment body not validated for length/content
  - `app/api/design/sessions/[id]/votes/route.ts` - vote comments accepted without length limits
  - `app/api/design/sessions/route.ts` - title/description trimmed but no max-length checks
- **Impact:** Database bloat from malicious text. Potential XSS if rendered without sanitization later.
- **Recommendation:**
  - Use Zod schemas for all request validation.
  - Enforce max lengths: titles 256 chars, descriptions 1024 chars, comments 500 chars.
  - Sanitize text input with a library like `sanitize-html` or `xss` if stored and re-rendered.

### No Retries or Resilience for External Dependencies

**Ollama Integration:**
- **Files:** `lib/ollama.ts`, API routes at `app/api/design/research/synthesize/route.ts`, etc.
- **Issue:** Single fetch call; no retry logic for timeouts, network errors, or Ollama service unavailability.
- **Impact:** Any Ollama hiccup causes synthesis to fail. Users see hard errors with no recovery path.
- **Recommendation:**
  - Implement exponential backoff retry (3 attempts, 2s/4s/8s delays).
  - Add timeout (30s) to fetch calls.
  - Return `{ status: "pending" }` and allow async polling instead of blocking request.

### Race Condition in Realtime Subscriptions

**Problem:** When a vote is inserted via realtime subscription, `loadSession()` is called but can race with concurrent user interactions.
- **Files:** `lib/design-store.tsx` lines 348-350 (realtime callback to `loadSession(id)`)
- **Scenario:** User casts vote → realtime fires → `loadSession()` called → but user simultaneously deletes session → state inconsistency.
- **Impact:** UI can display deleted sessions momentarily. Vote count can flicker. Optimistic updates aren't applied.
- **Recommendation:**
  - Implement optimistic updates: assume local vote will succeed immediately.
  - Debounce realtime reload calls (wait 500ms after last change before reloading).
  - Use `AbortController` to cancel in-flight requests when session is deleted.

### Weak Voter Identification

**Problem:** Voter identity based solely on localStorage `VOTER_ID_KEY` generated once per browser.
- **Files:** `lib/design-store.tsx` lines 62-69
- **Risk:** No ability to detect multi-voting from same device or identify vote patterns. Private browsing/incognito sessions get new voter IDs each time.
- **Impact:**
  - Can't prevent one user from voting multiple times (just use incognito).
  - Vote authenticity is entirely client-controlled.
- **Recommendation:**
  - For higher-fidelity sessions, optionally require voter email/name at vote time.
  - Log voter IP (from request headers) server-side for abuse detection.
  - Implement per-IP vote rate limiting.

### Silent Fire-and-Forget Operations

**Problem:** Notification inserts silently fail without logging or user feedback.
- **Files:**
  - `app/api/design/sessions/route.ts` line 67: `.catch(() => {})`
  - `app/api/design/sessions/[id]/comments/route.ts` line 121
  - `app/api/design/sessions/[id]/votes/route.ts` line 87
- **Impact:** Users won't know notifications aren't being stored. Database inconsistency undetected.
- **Recommendation:**
  - Log failures with error details: `console.error("Failed to insert notification:", err)`
  - Consider returning notification insert errors non-fatally in response (don't block vote/comment).

## Performance Concerns

### Inefficient Data Loading in Sessions List

**Problem:** `loadMySessions()` and `loadAllSessions()` in `design-store.tsx` load ALL options and votes for ALL sessions.
- **Files:** `lib/design-store.tsx` lines 183-259, 262-329
- **Current Pattern:**
  ```
  const [optionsRes, allVotesRes, votesRes] = await Promise.all([...])
  // Then manually filter options and votes for each session in memory
  ```
- **Scalability Issue:** With 100 sessions, this fetches 100+ options and 1000+ votes, filters in JavaScript.
- **Impact:** Slow initial page load. Network overhead. Memory usage scales poorly.
- **Fix Approach:**
  - Paginate sessions (10 per page).
  - Load only non-revealed session votes (to show vote count); skip full vote details.
  - Use Supabase RLS to filter by creator at database level instead of client-side.
  - Implement lazy-loading of vote details only when user clicks into a session.

### Unnecessary Chart Re-renders

**Problem:** `research-client.tsx` renders multiple large Recharts charts. Missing memoization.
- **Files:** `components/design/research-client.tsx` (2051 lines)
- **Issue:** Parent component re-renders → all chart data recalculated → all charts re-render even if data unchanged.
- **Impact:** Jank when toggling tabs or filtering observations.
- **Recommendation:**
  - Memoize chart data transformation with `useMemo()`.
  - Wrap chart components with `memo()` to skip re-renders if props unchanged.
  - Extract chart components to separate files to allow granular memoization.

### Missing Realtime Unsubscribe

**Problem:** Realtime subscriptions in `design-store.tsx` may not unsubscribe on cleanup.
- **Files:** `lib/design-store.tsx` lines 332-390 (useEffect with subscriptions)
- **Risk:** Memory leak. Multiple subscriptions accumulate if component mounts/unmounts multiple times.
- **Recommendation:**
  - Call `channel.unsubscribe()` in useEffect cleanup.
  - Verify `loadSession()` calls are debounced to avoid thrashing Supabase connection.

## Missing Critical Features

### No Session Password Protection

**Problem:** Sessions are publicly accessible to anyone with the URL. No per-session authentication.
- **Risk:** Sensitive design feedback visible to anyone who gets the link.
- **Recommendation:** Add optional "private session" mode requiring password to vote.

### No Audit Log or History

**Problem:** Can't see who deleted a session, when, or why.
- **Impact:** Can't recover accidentally deleted sessions. Can't investigate misuse.
- **Recommendation:**
  - Create `session_events` table logging all mutations (create, delete, phase change).
  - Store user identity (creator token hash) and timestamp.
  - Implement soft deletes (archive instead of hard delete).

### No Rate Limiting

**Problem:** Anyone can create unlimited sessions or cast unlimited votes.
- **Risk:** API abuse. Storage quota exceeded.
- **Recommendation:**
  - Implement per-IP rate limiting: 10 sessions/hour, 50 votes/minute.
  - Use `req.headers.get("x-forwarded-for")` to identify client IP.
  - Return 429 (Too Many Requests) when exceeded.

### No Data Expiration

**Problem:** Sessions and data accumulate indefinitely.
- **Impact:** Database grows unbounded. Old sessions pollute listings.
- **Recommendation:**
  - Archive sessions older than 90 days.
  - Implement scheduled cleanup job (e.g., `pg_cron`).
  - Inform users about retention policy.

## Fragile Patterns

### Dependent Session Mutations Without Transactions

**Problem:** Session creation inserts both session and options separately. If options fail, session remains orphaned.
- **Files:** `app/api/design/sessions/route.ts` lines 18-58
- **Current Recovery:** Manual cleanup `await db.from("voting_sessions").delete().eq("id", session.id)` at line 56
- **Risk:** Cleanup itself could fail, leaving orphaned session. Multiple concurrent creates could race.
- **Recommendation:**
  - Use database transactions (PostgreSQL `BEGIN...COMMIT`) to atomically create session + options.
  - Supabase supports `rpc()` — create a stored procedure `create_session_with_options()`.

### Inconsistent Phase Transitions

**Problem:** Phase transitions (`setup → voting → revealed → setup`) lack validation.
- **Files:** `app/api/design/sessions/[id]/route.ts`, `lib/design-store.tsx`
- **Risk:** Can transition to invalid state (e.g., `voting` → `setup` when votes exist).
- **Recommendation:**
  - Define valid state transitions in a state machine.
  - Validate in API routes: only allow `setup → voting`, `voting → revealed`, `revealed → setup`.
  - Prevent state changes if votes would be lost unexpectedly.

### Unvalidated Vote Effort/Impact Fields

**Problem:** Vote `effort` and `impact` fields are optional `EffortLevel` but no enum validation on insert.
- **Files:** `app/api/design/sessions/[id]/votes/route.ts`, `lib/design-types.ts` line 5
- **Risk:** Invalid values ("ultra-high", typos) accepted and stored.
- **Recommendation:**
  - Validate with Zod: `effort: z.enum(["low", "medium", "high"]).optional()`
  - Apply to all vote-related endpoints.

## Test Coverage Gaps

**Untested Areas:**
- **Admin authentication** (`/api/auth`): No tests for password validation, timing attacks, brute force.
- **File upload**: No validation tests for malicious files, size limits.
- **Realtime subscriptions**: No tests for subscription cleanup, race conditions.
- **Session deletion cascade**: No tests that deleting a session removes options and votes.
- **Concurrent mutations**: No tests for simultaneous vote/deletion races.
- **Vote counting logic**: Manual vote count computation in `loadMySessions()` — no unit tests.

**Priority:** Add tests for auth, file upload validation, and session deletion cascade before production use.

---

*Concerns audit: 2026-03-19*
