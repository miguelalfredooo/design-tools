# Architecture

**Analysis Date:** 2026-03-19

## Pattern Overview

**Overall:** Full-stack Next.js application with client-side state management via React Context, server-side API routes for database operations, and Supabase for persistent data storage.

**Key Characteristics:**
- File-based routing with App Router (Next.js 16)
- Server Components for data fetching, Client Components for interactivity
- Context-based state management for session/exploration data
- Type-safe API layer with Zod validation
- Real-time synthesis via local Ollama LLM
- External integrations: Supabase (database), Anthropic Claude (research synthesis), Figma (design embeds)

## Layers

**Presentation Layer:**
- Purpose: Render UI components, handle user interactions, display real-time feedback
- Location: `app/` pages, `components/design/` components
- Contains: Page components, feature components, UI primitives (shadcn/ui)
- Depends on: State layer (design-store), hooks, utilities
- Used by: Browser renders directly

**State Management Layer:**
- Purpose: Centralized state for sessions, votes, reactions, spatial comments; localStorage persistence
- Location: `lib/design-store.tsx` (React Context), `hooks/use-*` custom hooks
- Contains: SessionContext provider, session/vote/comment actions, voter identity
- Depends on: API layer, localStorage
- Used by: All client components

**API Layer:**
- Purpose: RESTful endpoints for CRUD operations on design sessions, voting, comments, research
- Location: `app/api/design/**/route.ts`
- Contains: POST/GET/PATCH/DELETE handlers, Supabase queries, validation
- Depends on: Supabase admin client, data types
- Used by: Client state management, external integrations

**Data Access Layer:**
- Purpose: Encapsulate Supabase queries, convert between row (snake_case) and entity types (camelCase)
- Location: `lib/design-api.ts`, `lib/design-types.ts`
- Contains: API request functions, row-to-entity converters, type definitions
- Depends on: Supabase client
- Used by: State management, API routes

**Data Storage:**
- Purpose: Persistent storage for sessions, options, votes, comments, research insights
- Database: Supabase PostgreSQL
- Tables: `voting_sessions`, `voting_options`, `voting_votes`, `design_comments`, `research_insights`, etc.

**Utilities & Services:**
- Purpose: Reusable logic, helpers, external service integrations
- Location: `lib/`, `hooks/`
- Contains: UUID generation, color mapping, seeded shuffle, Ollama client, Figma integration
- Used by: Multiple layers

## Data Flow

**Session Creation Flow:**

1. User fills "Create Session" dialog (title, description, options, brief)
2. Dialog calls `createSession()` from SessionContext
3. SessionContext calls `apiCreateSession()` from design-api
4. design-api POSTs to `/api/design/sessions`
5. Route handler validates, creates session + options in Supabase
6. Returns session ID and creatorToken
7. creatorToken stored in localStorage (keyed by sessionId)
8. SessionContext updates state, user navigates to exploration page

**Voting Flow:**

1. User votes on option in voting phase
2. VotingOptionCard calls `castVote()` from SessionContext
3. SessionContext calls `apiCastVote()` with optionId, voterId, voterName, optional comment
4. design-api POSTs to `/api/design/sessions/[id]/votes`
5. Route validates session in voting phase, option exists, inserts vote record
6. Fires notification (fire-and-forget)
7. SessionContext refetches session to show updated vote counts
8. UI updates vote bar, pins vote if from creator

**Results Reveal Flow:**

1. Creator clicks "Reveal Results" button
2. VotingOptionCard calls `revealResults()` from SessionContext
3. SessionContext calls `apiUpdateSession()` with phase="revealed"
4. Route validates creatorToken, updates session.phase to "revealed"
5. SessionContext refetches session
6. UI renders ResultsReveal component showing winning options, all votes with comments

**Spatial Comments Flow:**

1. User clicks on image to place comment at x/y coordinates
2. SpatialCommentLayer captures click, calls `addSpatialComment()` from SessionContext
3. SessionContext calls `apiAddSpatialComment()` with optionId, body, xPct, yPct
4. Route inserts comment to `design_comments` table
5. SessionContext refetches comments for that option
6. SpatialCommentLayer re-renders with new comment pin

**Research Synthesis Flow:**

1. User triggers research synthesis on Research page
2. ResearchClient calls API endpoint `/api/design/research/synthesize`
3. Route fetches all observations/segments from Supabase
4. Calls local Ollama (llama3.2) to synthesize data into insights
5. Inserts insights (themes, opportunities, consensus, tensions) into `research_insights`
6. Returns insights to client
7. ResearchClient displays tabs: Overview (summary), Observations (raw data), Segments (clusters), Replays (session-level insights), Reference (external data)

**State Management:**

- **Session State:** Held in SessionContext, persisted to Supabase, refetched on mutation
- **Voter Identity:** localStorage (voterId, name)
- **Creator Tokens:** localStorage keyed by sessionId
- **Admin Mode:** localStorage (admin password override)
- **Theme:** Context via next-themes (dark/light)
- **Reactions:** Loaded on-demand from Supabase

## Key Abstractions

**ExplorationSession:**
- Purpose: Represents a design voting session with options, votes, metadata
- Examples: `lib/design-types.ts` ExplorationSession interface
- Pattern: Plain data object with conversion functions (sessionFromRow) from DB rows

**ExplorationOption:**
- Purpose: Individual design option within a session
- Properties: id, title, description, mediaType (image/figma/excalidraw), mediaUrl, position, rationale
- Pattern: Immutable data with optional fields for flexible creation

**Vote & SpatialComment:**
- Purpose: Voter feedback tied to options
- Pattern: Each voter can have one vote per session (unique constraint), unlimited comments with spatial coordinates
- Used by: ResultsReveal (vote aggregation), SpatialCommentLayer (visual annotation)

**SessionContext:**
- Purpose: Global state management for all session operations
- Pattern: React Context with memoized functions to prevent unnecessary re-renders
- Functions: loadSession, createSession, castVote, undoVote, addSpatialComment, revealResults, etc.
- Usage: Wrapped around app in `providers.tsx`

**ResearchInsight:**
- Purpose: Synthesized understanding from design research (themes, opportunities, signals)
- Types: theme, opportunity, consensus, tension, signal, recommendation, sentiment
- Pattern: Generated by Ollama, stored in research_insights table, tagged with batch_id and optional session_id

## Entry Points

**RootLayout (`app/layout.tsx`):**
- Location: `app/layout.tsx`
- Triggers: Every page load
- Responsibilities: Loads Manrope font, wraps with Providers (theme, session context, toasts)

**HomePage (`app/page.tsx`):**
- Location: `app/page.tsx`
- Triggers: User navigates to `/` or `/tools/design`
- Responsibilities: Lists user's sessions and all public sessions, create/delete sessions, tab switching

**ExplorationPage (`app/explorations/[id]/page.tsx`):**
- Location: `app/explorations/[id]/page.tsx`
- Triggers: User clicks session from list or shares link
- Responsibilities: Load session, render voting interface, handle vote/comment interaction, show results

**ResearchPage (`app/research/page.tsx`):**
- Location: `app/research/page.tsx`
- Triggers: User navigates to `/research`
- Responsibilities: Load latest research batch, display synthesis insights with tabs

**API Routes:**
- `/api/design/sessions` - Create session (POST), list sessions (GET with pagination)
- `/api/design/sessions/[id]` - Get session details (GET), update phase (PATCH), delete session (DELETE)
- `/api/design/sessions/[id]/votes` - Cast vote (POST), undo vote (DELETE), pin vote (PATCH)
- `/api/design/sessions/[id]/options` - Add/update/remove options (POST/PATCH/DELETE)
- `/api/design/sessions/[id]/comments` - Spatial comments (GET/POST/DELETE)
- `/api/design/research/**` - Research endpoints (synthesis, observations, segments)

## Error Handling

**Strategy:** Client-side try/catch with toast notifications, server-side validation with 400/500 status codes

**Patterns:**

- API layer (`design-api.ts`) wraps fetch calls with error handling: throws on non-OK status, client catches and shows toast
- Route handlers validate input (title, creatorToken, phase, etc.) and return 400 for client errors
- SessionContext mutations wrapped in try/catch, toast.error on failure
- Supabase errors bubble up from route handlers (e.g., "Session not found" → 404)

## Cross-Cutting Concerns

**Logging:** console.log/error in development, no centralized logging (could be added)

**Validation:**
- Route handlers: manual validation (title?.trim(), Array.isArray, type checks)
- Form inputs: HTML5 validation + component-level checks (disabled submit if invalid)
- Creator operations: creatorToken validation on server

**Authentication:**
- No user auth system; voter identity via localStorage (voterId generated client-side)
- Creator access via creatorToken (UUID stored in localStorage, validated in API routes)
- Admin access via admin password in localStorage, passed in request body
- No session-based auth; stateless API

**Authorization:**
- Session creation: No restrictions (anyone can create)
- Session modification: Creator token required (validated server-side)
- Vote casting: Only during voting phase, no voter auth needed
- Admin operations: Admin password required (for migrations, health checks)

---

*Architecture analysis: 2026-03-19*
