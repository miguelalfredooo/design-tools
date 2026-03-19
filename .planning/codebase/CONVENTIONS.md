# Coding Conventions

**Analysis Date:** 2026-03-19

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `CreateSessionDialog.tsx`, `VotingOptionCard.tsx`)
- Utilities and helpers: camelCase with `.ts` extension (e.g., `design-utils.ts`, `design-api.ts`)
- Hooks: `use-*` prefix in camelCase (e.g., `use-voter-identity.ts`, `use-session-insights.ts`)
- API routes: lowercase with hyphens (e.g., `synthesize`, `share-tokens`)

**Functions:**
- Regular functions and hooks: camelCase (e.g., `generateId()`, `getInitials()`, `useVoterIdentity()`)
- React components: PascalCase (e.g., `function CreateSessionDialog()`, `export function VotingProgress()`)
- Private functions: camelCase with optional leading underscore (e.g., `getCreatorTokens()`)
- Async API functions: `api*` prefix in camelCase (e.g., `apiCreateSession()`, `apiCastVote()`, `apiAddSpatialComment()`)

**Variables:**
- Constants: UPPER_SNAKE_CASE (e.g., `CREATOR_TOKENS_KEY`, `VOTER_ID_KEY`, `VOTER_COLORS`)
- Local variables and state: camelCase (e.g., `sessionId`, `voterName`, `creatorToken`)
- Database/API response fields: snake_case (e.g., `creator_token`, `session_id`, `voter_id`)
- Derived state from DB rows: camelCase (e.g., `sessionFromRow()` converts `creator_token` to `creatorToken`)

**Types:**
- Interface/type names: PascalCase with descriptive names (e.g., `ExplorationSession`, `VotingOptionRow`, `SessionContextValue`)
- Row types: PascalCase with `Row` suffix for Supabase database shapes (e.g., `VotingSessionRow`, `VotingOptionRow`, `DesignCommentRow`)
- Client types: PascalCase without suffix for app-facing models (e.g., `ExplorationSession`, `ExplorationOption`, `Vote`)
- Union types: PascalCase (e.g., `Phase`, `MediaType`, `EffortLevel`)

## Code Style

**Formatting:**
- No dedicated formatter configured (no `.prettierrc`, no Prettier in devDependencies)
- ESLint used for linting with Next.js configuration
- 2-space indentation (inferred from codebase)
- Semicolons required (TypeScript default)

**Linting:**
- ESLint v9 with Next.js and TypeScript presets
- Config: `eslint.config.mjs` using `eslint/config`, `eslint-config-next/core-web-vitals`, `eslint-config-next/typescript`
- Run: `npm run lint`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

**TypeScript:**
- `strict: true` in `tsconfig.json`
- Target: ES2017
- Path alias: `@/*` maps to project root for clean imports
- React JSX mode: `react-jsx` (automatic JSX transform)

## Import Organization

**Order:**
1. React and Next.js core imports
2. Third-party dependencies (lucide-react, sonner, etc.)
3. Type imports from `@/*` library
4. Function/constant imports from `@/*` library
5. Local component imports
6. Relative component imports (rare)

**Pattern example from `/app/explorations/[id]/page.tsx`:**
```typescript
"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  // ...lucide icons
} from "lucide-react";
import { toast } from "sonner";
import { useSessions } from "@/lib/design-store";
import { useSessionInsights } from "@/hooks/use-session-insights";
import { useVoterIdentity } from "@/hooks/use-voter-identity";
import { seededShuffle } from "@/lib/design-utils";
import { Button } from "@/components/ui/button";
import { VotingProgress } from "@/components/design/voting-progress";
```

**Path Aliases:**
- `@/*` → project root, used throughout for clean imports
- No other aliases configured

## Error Handling

**Patterns:**
- API routes use `NextResponse.json()` with explicit status codes (400, 401, 403, 404, 500)
- Error messages included in response: `{ error: "description" }`
- Database errors from Supabase destructured as `{ data, error }`
- Try-catch for external service calls (Ollama, fetch)
- Fire-and-forget operations use `.catch(() => {})` to ignore errors (e.g., notifications, storage operations)

**Error type checking:**
```typescript
try {
  // code
} catch (err) {
  const message = err instanceof Error ? err.message : "Fallback message";
}
```

**Error response example from `app/api/design/sessions/[id]/route.ts`:**
```typescript
if (!creatorToken && !adminPassword) {
  return NextResponse.json({ error: "Missing creatorToken" }, { status: 401 });
}

if (sessionErr || !session) {
  return NextResponse.json({ error: sessionErr?.message ?? "Failed to create session" }, { status: 500 });
}
```

## Logging

**Framework:** No centralized logging library; console not used in production code. Error messages returned via API responses.

**Pattern:** Errors are surfaced to clients via `NextResponse.json()` with descriptive messages:
- Client-side: `toast()` from Sonner for user notifications
- Server-side: error messages included in HTTP response body
- No structured logging observed (no Winston, Pino, etc.)

## Comments

**When to Comment:**
- Section headers using `// --- Category Name ---` to organize large files
- Complex algorithms with inline comments (e.g., "Fisher-Yates with seeded pseudo-random")
- Non-obvious business logic (e.g., "During revealed phase, return all votes")
- Deprecated fields marked with `@deprecated` in JSDoc

**JSDoc/TSDoc:**
- Used selectively for utility functions
- Pattern: `/** Description of function behavior */`
- Example from `design-utils.ts`:
```typescript
/**
 * Deterministic shuffle using a seed string (e.g. voterId).
 * Returns a new array with elements shuffled consistently for the same seed.
 */
export function seededShuffle<T>(items: T[], seed: string): T[] {
```

- Public function documentation common for utilities, optional for components
- No parameter-level `@param` documentation observed

## Function Design

**Size:** Functions typically 30-100 lines
- Largest component: `research-client.tsx` (2051 lines, includes full page logic)
- API route functions: 50-150 lines
- Utility functions: 5-50 lines

**Parameters:**
- Use object parameters for functions with 2+ arguments
- Example: `apiCreateSession(params: { title, description, options, ... })`
- Single values acceptable for 1-2 argument functions (e.g., `getInitials(name)`)

**Return Values:**
- API functions return typed promises: `Promise<T>` where T is explicit (e.g., `Promise<{ id: string; creatorToken: string }>`)
- Hooks return object with properties (e.g., `{ name, setName, clearName, voterId }`)
- Void functions when performing side effects (e.g., `loadSession(id): Promise<void>`)

## Module Design

**Exports:**
- Named exports preferred: `export function VotingProgress() { ... }`
- Default exports used for page components (Next.js convention)
- No barrel files observed (no `index.ts` re-exporting from directories)

**Organization:**
- Types defined near usage in same file or in dedicated `*-types.ts` files
- Conversion functions (row ↔ client types) placed below type definitions
- Constants grouped at top of file or section

**Example structure from `design-types.ts`:**
```typescript
// Client types first
export interface ExplorationSession { ... }
export interface ExplorationOption { ... }

// Row types (DB shapes)
export interface VotingSessionRow { ... }

// Conversion functions
export function sessionFromRow(...) { ... }
export function optionFromRow(...) { ... }
```

## State Management

**Context Pattern:**
- Single context per domain (`SessionContext` in `design-store.tsx`)
- Context value type defined as interface before context creation
- Provider component wraps children: `export function SessionProvider({ children })`
- Hook to access context: `export function useSession() { ... }`

**localStorage Keys:**
- Prefixed with domain: `CREATOR_TOKENS_KEY = "design-creator-tokens"`
- Extracted to constants at module top

## Type Conversion

**Row → Client types:**
- Separate conversion function per type (e.g., `sessionFromRow()`, `voteFromRow()`, `spatialCommentFromRow()`)
- Handle nullability: DB nulls become undefined in client types
- Time conversion: `new Date(row.created_at).getTime()` for Unix timestamps
- Deprecated fields handled explicitly (marked with `@deprecated` comment)

---

*Convention analysis: 2026-03-19*
