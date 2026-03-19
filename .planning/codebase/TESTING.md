# Testing Patterns

**Analysis Date:** 2026-03-19

## Test Framework

**Status:** No testing framework configured

- **Test Runner:** Not installed (no Jest, Vitest, or other runner in package.json)
- **Assertion Library:** Not installed
- **Config Files:** None found
- **Test Scripts:** No test script in `package.json`
- **Test Files:** No `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files in source tree

## Test File Organization

**Not Implemented**

- No co-located test files (no `ComponentName.test.tsx` alongside `ComponentName.tsx`)
- No separate `__tests__` directories
- No test utilities or fixtures

## Testing Patterns

**Current Approach:** Manual testing only

The codebase relies on:
- Manual UI testing in browser during development
- API testing via curl/Postman (inferred from lack of automated tests)
- Prop drilling and type safety from TypeScript strict mode

## Mocking

**Not Implemented**

- No mocking library (no Mock Service Worker, jest.mock, vi.mock, etc.)
- External services called directly:
  - Supabase client: `supabase.from("table").select(...)`
  - Ollama API: HTTP fetch with error handling
  - Next.js fetch: no polyfilling or mocking infrastructure

## Testing Approach for New Features

**How developers currently verify changes:**

1. **Type Safety:** TypeScript `strict: true` catches many errors
2. **Linting:** ESLint runs during development (command: `npm run lint`)
3. **Manual UI Testing:** Run `npm run dev` (port 3500), interact with UI in browser
4. **API Testing:** Use Supabase dashboard or direct HTTP requests to `/api/design/*` endpoints
5. **Validation:** Zod schemas validate inputs at runtime

**Example validation pattern from `app/api/design/sessions/route.ts`:**
```typescript
if (!title?.trim() || !creatorToken) {
  return NextResponse.json({ error: "Missing title or creatorToken" }, { status: 400 });
}
if (!Array.isArray(options) || options.filter((o: { title?: string }) => o.title?.trim()).length < 2) {
  return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });
}
```

## Error Handling Coverage

**Observable error paths (manually testable):**

1. **API Input Validation:** All routes check required fields and return 400 errors
2. **Database Errors:** Supabase errors checked and returned with message
3. **Authorization:** Creator token and admin password validated before operations
4. **Phase Validation:** Session phase checked before allowing state transitions
5. **External Service Failures:** Ollama API failures caught in try-catch with fallback messages

**Example from `app/api/design/sessions/[id]/synthesize/route.ts`:**
```typescript
try {
  // call Ollama API
} catch (err) {
  const message = err instanceof Error ? err.message : "Ollama request failed";
  return NextResponse.json({ error: message }, { status: 500 });
} catch {
  return NextResponse.json({ error: "Request failed" }, { status: 500 });
}
```

## Type-Safety as Test Mechanism

**TypeScript Coverage:** 100% of codebase

- Strict mode enabled (`"strict": true`)
- Type definitions for all database shapes (row types) and client types
- Conversion functions between row and client types typed
- Component props fully typed with interfaces
- API responses typed (e.g., `Promise<{ id: string; creatorToken: string }>`)

**Example type safety from `design-store.tsx`:**
```typescript
interface SessionContextValue {
  session: ExplorationSession | null;
  loading: boolean;
  loadSession: (id: string) => Promise<void>;
  createSession: (...) => Promise<ExplorationSession>;
  // 140+ lines of method signatures
}
```

This provides compile-time verification that:
- Components calling context methods pass correct arguments
- Return types are used correctly
- State updates maintain type consistency

## Coverage Status

**Unmeasured and Not Enforced**

- No coverage threshold defined
- No coverage reporting tool configured
- Critical paths without automated test coverage:
  - Voting workflow: cast vote → undo vote → reveal results
  - Session lifecycle: create → setup → voting → revealed → delete
  - Spatial comments: add → delete → retrieve
  - Reactions/hearts: toggle on/off
  - Synthesize flows: API to Ollama and back

## What's Testable Now

**Without framework setup, developers can test:**

1. **Component Rendering:** Mount components in browser, verify UI appears
2. **User Interactions:** Click buttons, fill forms, verify state updates
3. **API Endpoints:** POST to `/api/design/sessions`, verify session created
4. **Data Flow:** Load session, cast vote, check results update
5. **Error States:** Attempt unauthorized operations, verify 401/403 responses

## Recommended Future Test Setup

If testing framework added:

**Unit Tests:**
- Utility functions (`design-utils.ts`): `generateId()`, `getInitials()`, `seededShuffle()`, `getVoterColor()`
- Type conversion functions (`design-types.ts`): `sessionFromRow()`, `voteFromRow()`, etc.
- Hooks: `useVoterIdentity()`, `useCreatorIdentity()`, `useSessionInsights()`

**Integration Tests:**
- API routes with mocked Supabase client
- Context providers with mocked API calls
- Full session lifecycle: create → vote → reveal

**E2E Tests:**
- Voting flow: join session → enter name → cast vote → see results
- Creator flow: create session → start voting → reveal results → delete
- Admin flow: access design-ops page, seed data, run crew agents

---

*Testing analysis: 2026-03-19*
