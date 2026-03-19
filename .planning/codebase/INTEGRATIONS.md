# External Integrations

**Analysis Date:** 2026-03-19

## APIs & External Services

**Anthropic Claude API:**
- Endpoint: `https://api.anthropic.com/v1/messages`
- SDK: `@anthropic-ai/sdk` 0.78.0
- Model: `claude-sonnet-4-20250514`
- Auth: Environment variable `ANTHROPIC_API_KEY`
- Purpose: Generate HTML/Tailwind code from Figma designs and screenshots
- Implemented in: `app/api/figma/generate/route.ts`
- Features: Image vision capability, streaming responses, 8192 token max output

**Figma API:**
- Endpoints:
  - `https://api.figma.com/v1/images/{fileKey}` - Fetch node screenshots (PNG format)
  - `https://api.figma.com/v1/files/{fileKey}/nodes` - Fetch node tree structure
- Auth: `X-Figma-Token` header with `FIGMA_ACCESS_TOKEN`
- Client library: Custom HTTP fetch in `lib/figma.ts`
- Purpose: Extract design components and metadata for code generation
- Validation: Zod schemas `figmaRequestSchema`, `figmaImagesResponseSchema`, `figmaNodesResponseSchema`

**Ollama (Local LLM):**
- Endpoint: `http://localhost:11434/api/generate` (default, configurable via `OLLAMA_BASE_URL`)
- Model: `llama3.2` (default, configurable via `OLLAMA_MODEL`)
- Client library: Custom HTTP fetch in `lib/ollama.ts`
- Auth: None (local service)
- Purpose: Synthesize design research insights from session data
- Features:
  - Temperature: 0.3 (low randomness for structured output)
  - Max tokens: 4096
  - Non-streaming mode
- Used in: `app/api/design/research/synthesize/route.ts`, `app/api/design/research/observe-synthesize/route.ts`

**Crew AI (Python Agent Framework):**
- Endpoint: `http://localhost:8000/run` (configurable via `CREW_API_URL`)
- Framework: CrewAI 1.10.1 + FastAPI
- Transport: Server-sent events (SSE) for streaming
- Purpose: Multi-agent orchestration for design operations (analysis, recommendations)
- Implemented in: `crew/main.py` (FastAPI server)
- Used by: `app/api/design-ops/run/route.ts` (proxy)
- Auth: None (localhost service)

## Data Storage

**Primary Database: Supabase PostgreSQL**

**Connection:**
- URL env var: `NEXT_PUBLIC_SUPABASE_URL`
- Service role key: `SUPABASE_SERVICE_ROLE_KEY` (server-side writes)
- Anon key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-side reads with RLS)
- Client: `@supabase/supabase-js` 2.98.0

**Clients:**
- `lib/supabase.ts` - Client-side Supabase instance (nullable if env vars missing)
- `lib/supabase-server.ts` - `getSupabaseAdmin()` function for API routes (requires both env vars)

**Schema (from `supabase/migrations/`):**

| Table | Purpose |
|-------|---------|
| `voting_sessions` | Design voting sessions (title, description, problem, goal, audience, constraints, participant_count) |
| `voting_options` | Design options/alternatives within a session (media_type, media_url, rationale, effort, impact) |
| `voting_votes` | Vote records (option_id, voter_token, effort, impact ratings) |
| `design_comments` | Spatial comments on options (x%, y% position, comment body, voter info) |
| `design_reactions` | Emoji reactions on options (voter_token, reaction type) |
| `explorations` | Design explorations (title, description, created_by) |
| `votes_explorations` | Votes on explorations (vote_type) |
| `spatial_comments` | Legacy spatial comment table (x, y coordinates, comment text, author) |
| `research_observations` | Qualitative research data (observation text, area, category, body, contributor, source_url, metadata JSON) |
| `research_segments` | Research segments/personas (name, description) |
| `research_segment_items` | Items within research segments (bucket, title, body, source_observation_ids, batch_id) |
| `research_insights` | Synthesis results from Ollama (type: theme/opportunity/consensus/tension/open_question/signal/one_metric, title, body, mentions, tags, batch_id, session_ids) |
| `gallery_comments` | Comments on design gallery items |
| `nooooowhere_notifications` | Cross-project notifications |
| `nooooowhere_notification_reads` | Notification read status tracking |

**File Storage:**
- Not detected - Media stored as URLs (Figma exports, uploaded URLs)

**Caching:**
- Not detected - Uses database queries directly

## Authentication & Identity

**Session/User Identity:**
- Token-based: Each design session has a `creator_token` (UUID in `voting_sessions` table)
- Voter identity: `voterId` / `voter_token` used to track individual votes
- Voter name: `voter_name` stored with votes and comments
- Admin password: `adminPassword` header for deletion/modification privileges (checked in API routes)
- Method: Custom token-based (not OAuth/SSO)

**Supabase RLS (Row-Level Security):**
- Used: Conditional based on configuration
- Server-side: Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS in API routes
- Client-side: Uses anon key with RLS policies (not visible in codebase)

## Monitoring & Observability

**Error Tracking:**
- Not detected - Errors handled locally in API routes

**Logging:**
- Not detected - Console logging only (implied via try/catch blocks)

**Analytics:**
- Not detected

## CI/CD & Deployment

**Hosting:**
- Not configured in codebase (deployment handled externally)

**CI Pipeline:**
- Not detected (no GitHub Actions, GitLab CI, or similar config files)

## Environment Configuration

**Environment Files:**
- `.env.local` present - Development configuration
- Loaded at: Runtime (Next.js automatic with `process.env.*` and `NEXT_PUBLIC_*`)

**Public Environment Variables (safe to expose):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase endpoint URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (restricted by RLS)

**Private Environment Variables (server-only):**
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key (never expose to client)
- `ANTHROPIC_API_KEY` - Claude API credentials
- `FIGMA_ACCESS_TOKEN` - Figma API credentials
- `OLLAMA_BASE_URL` - Local service endpoint (optional)
- `OLLAMA_MODEL` - Model selection (optional)
- `CREW_API_URL` - Local Crew service endpoint (optional)

## Webhooks & Callbacks

**Incoming Webhooks:**
- Not detected

**Outgoing:**
- Not detected - All integrations are request/response based

## API Routes & Internal Endpoints

**Design Session Management:**
- `POST /api/design/sessions` - Create voting session
- `GET /api/design/sessions/:id` - Fetch session with options and votes
- `PATCH /api/design/sessions/:id` - Update session (title, phase, participant_count)
- `DELETE /api/design/sessions/:id` - Delete session

**Voting & Reactions:**
- `POST /api/design/sessions/:id/votes` - Cast vote
- `DELETE /api/design/sessions/:id/votes` - Undo vote
- `PATCH /api/design/sessions/:id/votes` - Pin/unpin vote
- `GET /api/design/sessions/:id/reactions` - Get emoji reactions
- `POST /api/design/sessions/:id/reactions` - Toggle reaction

**Spatial Comments:**
- `GET /api/design/sessions/:id/comments?optionId=` - Fetch comments for option
- `POST /api/design/sessions/:id/comments` - Add comment at x%,y% position
- `DELETE /api/design/sessions/:id/comments` - Delete comment

**Design-to-Code:**
- `POST /api/figma/route` - Fetch Figma screenshot (no request body parsing)
- `POST /api/figma/generate` - Generate HTML from Figma design (fileKey, nodeId, screenshotUrl)

**Research & Synthesis:**
- `POST /api/design/research/observations` - Log research observation
- `POST /api/design/research/segments` - Create research segment
- `POST /api/design/research/segments/:id/items` - Add segment items
- `POST /api/design/research/synthesize` - Run Ollama synthesis on all sessions
- `POST /api/design/research/observe-synthesize` - Synthesize observations
- `POST /api/design/research/replay-synthesize` - Synthesize replay data
- `POST /api/design/research/replay-insights` - Get insights from replays
- `POST /api/design/research/share-tokens` - Generate share tokens

**Design Operations:**
- `POST /api/design-ops/run` - Proxy request to Crew FastAPI service
- `GET /api/design-ops/health` - Health check for Crew service

**Admin/Migrations:**
- `POST /api/design/migrations` - Run schema migrations
- `POST /api/admin/apply-migration` - Apply specific migration
- `POST /api/admin/add-columns` - Add columns dynamically
- `POST /api/design/research/seed` - Seed sample data

## Data Flow

**Session Creation → Voting → Synthesis:**
1. User creates session via `POST /api/design/sessions`
2. Session stored in `voting_sessions` table with creator token
3. Users join and vote on options
4. Votes stored in `voting_votes` table with voter tokens
5. Comments added via spatial comment API
6. When ready, `POST /api/design/research/synthesize` is called
7. Ollama generates insights from session data
8. Insights stored in `research_insights` table with batch_id

**Design-to-Code Flow:**
1. User uploads Figma fileKey and nodeId
2. `POST /api/figma/generate` fetches node tree + screenshot from Figma
3. Sends to Claude with vision capability
4. Claude generates HTML/Tailwind via streaming
5. Response piped as text/plain stream to client

**Crew Agent Flow:**
1. Client calls `POST /api/design-ops/run` with prompt
2. Server proxies to Crew FastAPI on port 8000
3. Crew agents process request (SSE streaming)
4. Results streamed back to client

---

*Integration audit: 2026-03-19*
