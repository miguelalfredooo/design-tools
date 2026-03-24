---
title: "feat: Add Design Ops Crew"
type: feat
date: 2026-03-11
---

# feat: Add Design Ops Crew

## Overview

Add a multi-agent AI Design Ops team to Carrier, powered by CrewAI and local Ollama (qwen3.5). V1 ships two agents — **Oracle** (orchestrator) and **Meridian** (research synthesizer) — accessed from a new top-level "Design Ops" sidebar item. Users define business objectives, provide a focus prompt, and trigger on-demand synthesis that connects scattered evidence to KPIs with explicit confidence labeling.

## Problem Statement

Carrier's current synthesis is siloed — 4 independent one-shot Ollama calls that don't cross-reference each other or tie findings to business objectives. Evidence (observations, session feedback, team learnings) lives in disconnected places. No system connects "what we're seeing" to "what we should design to move metrics."

## Proposed Solution

A Python FastAPI microservice running CrewAI alongside the existing Next.js app. Oracle receives user context and business objectives, frames the brief, routes to Meridian. Meridian pulls evidence from Supabase, synthesizes with confidence labels, and returns actionable recommendations tied to KPIs. Results display as a timeline of agent messages in the Carrier UI.

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────┐
│  Next.js Frontend (port 3500)                   │
│                                                 │
│  /design-ops page                               │
│    ├─ Objectives editor (read/write local JSON) │
│    ├─ Focus prompt input                        │
│    ├─ "Run Crew" button                         │
│    └─ Agent timeline display                    │
│                                                 │
│  /api/design-ops/run (proxy route)              │
│    └─ POST → FastAPI /run                       │
│                                                 │
│  /api/design-ops/objectives (CRUD route)        │
│    └─ read/write data/objectives.json           │
├─────────────────────────────────────────────────┤
│  FastAPI Microservice (port 8000)               │
│                                                 │
│  POST /run                                      │
│    ├─ Reads objectives from request body        │
│    ├─ Reads evidence from Supabase              │
│    ├─ Runs CrewAI crew (Oracle + Meridian)      │
│    ├─ Streams agent messages via SSE            │
│    └─ Returns final results                     │
│                                                 │
│  GET /health                                    │
│    └─ Returns service + Ollama status           │
├─────────────────────────────────────────────────┤
│  Ollama (port 11434)                            │
│    └─ qwen3.5 model                             │
├─────────────────────────────────────────────────┤
│  Supabase                                       │
│    └─ research_observations, voting_sessions,   │
│       options, votes, spatial_comments          │
└─────────────────────────────────────────────────┘
```

### Key Decisions (resolving spec gaps)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Next.js ↔ FastAPI communication | Next.js API route proxies to FastAPI server-side | Avoids CORS, keeps FastAPI internal |
| Objectives storage | `data/objectives.json` in project root, managed by Next.js API route | Simplest local storage; FastAPI receives objectives in request body |
| Objectives schema | `{ id, title, metric, target, description, createdAt }` | Minimal but complete |
| Crew results storage | In-memory per run, displayed in UI. Not persisted to Supabase in v1 | Keeps v1 simple; persistence is v2 |
| Agent conversation display | Timeline of cards — agent name, subject, confidence badge, body, assumptions collapsible | Matches existing card patterns |
| User input to Oracle | Free-text prompt + objective selection checkboxes | Allows targeted or broad analysis |
| Streaming vs batch | SSE streaming — agent messages appear as they're produced | Better UX for 1-3 min runs |
| Admin gating | Admin-only, consistent with existing synthesis | Prevents accidental compute usage |
| Existing synthesis coexistence | Unchanged in v1, Design Ops is additive | No breaking changes |
| Model | FastAPI uses qwen3.5; existing Next.js routes keep llama3.2 | No migration risk |
| Evidence scope | V1 uses existing Supabase data only (observations, sessions, votes, comments) | Expanded intake deferred to v2 |
| Context window overflow | Meridian selects most recent evidence (last 30 days) + filters by relevance to selected objectives | Prevents token overflow |
| Feedback on outputs | Deferred to v2 | V1 is read-only output |

### Implementation Phases

#### Phase 1: FastAPI Microservice + CrewAI Agents

**Goal:** Working crew that can be triggered from the command line.

**New files:**
```
crew/
├── requirements.txt
├── .env.example
├── main.py              # FastAPI app with /run and /health endpoints
├── agents/
│   ├── __init__.py
│   ├── oracle.py        # Oracle agent definition (role, goal, backstory)
│   └── meridian.py      # Meridian agent definition
├── tasks/
│   ├── __init__.py
│   ├── frame_brief.py   # Oracle's task: frame the synthesis brief
│   └── synthesize.py    # Meridian's task: pull evidence + synthesize
├── tools/
│   ├── __init__.py
│   └── supabase_tool.py # CrewAI tool that queries Supabase for evidence
└── crew.py              # Crew assembly (Oracle manager, Meridian worker)
```

**Tasks:**

- [x] Create `crew/` directory with Python 3.12 venv
- [x] `crew/requirements.txt`: crewai, litellm, fastapi, uvicorn, supabase-py, python-dotenv
- [x] `crew/.env.example`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`
- [x] `crew/agents/oracle.py` — Oracle agent with role, goal, backstory from agent specs. Manager role. Personality: calm, strategic, direct. Frames briefs with Objective → What we have → What we're assuming → Desired output
- [x] `crew/agents/meridian.py` — Meridian agent with role, goal, backstory from agent specs. Worker role. Confidence tiers (High/Medium/Low), assumption labeling, always ends with recommendation
- [x] `crew/tools/supabase_tool.py` — CrewAI `@tool` that queries Supabase for observations, sessions, votes, comments. Accepts optional date range and area filters. Returns formatted evidence summary
- [x] `crew/tasks/frame_brief.py` — Oracle's task: receive user prompt + objectives, frame a structured brief for Meridian
- [x] `crew/tasks/synthesize.py` — Meridian's task: use supabase_tool to pull evidence, synthesize findings with confidence labels, map to objectives, output recommendations
- [x] `crew/crew.py` — Assemble the crew with `manager_agent=oracle`, `agents=[meridian]`, `process=Process.hierarchical`
- [x] `crew/main.py` — FastAPI app:
  - `POST /run` — accepts `{ prompt, objectives }`, runs crew, streams SSE events for each agent message
  - `GET /health` — checks Ollama connectivity and returns status
- [x] Test crew from command line: `cd crew && python -c "from crew import ...; crew.kickoff()"`

**Success criteria:** Running `curl -X POST localhost:8000/run -d '{"prompt": "...", "objectives": [...]}' ` returns streamed agent messages with confidence labels.

---

#### Phase 2: Next.js Integration (API Routes + Objectives)

**Goal:** Frontend can trigger the crew and manage objectives.

**New files:**
```
app/api/design-ops/
├── run/route.ts           # Proxy to FastAPI POST /run (SSE passthrough)
├── health/route.ts        # Proxy to FastAPI GET /health
└── objectives/route.ts    # CRUD for data/objectives.json
data/
└── objectives.json        # Local objectives store (initially [])
lib/
└── design-ops-types.ts    # TypeScript types for objectives, agent messages, crew runs
```

**Tasks:**

- [x] `lib/design-ops-types.ts` — Types:
  ```typescript
  interface Objective { id: string; title: string; metric: string; target: string; description: string; createdAt: string; }
  interface AgentMessage { from: string; to: string; subject: string; priority: 'critical' | 'standard' | 'advisory'; confidence: 'high' | 'medium' | 'low'; assumptions: string; body: string; nextStep: string; timestamp: string; }
  interface CrewRun { id: string; prompt: string; objectives: Objective[]; messages: AgentMessage[]; status: 'running' | 'completed' | 'error'; startedAt: string; completedAt?: string; }
  ```
- [x] `data/objectives.json` — Initialize as empty array `[]`
- [x] `app/api/design-ops/objectives/route.ts` — GET (read file), POST (add objective), DELETE (remove by id). Read/write `data/objectives.json` using `fs` module
- [x] `app/api/design-ops/health/route.ts` — Proxy GET to `http://localhost:8000/health`. Return `{ status: 'ok' | 'unavailable', details }`. Handle connection refused gracefully
- [x] `app/api/design-ops/run/route.ts` — Proxy POST to `http://localhost:8000/run`. Pass through SSE stream from FastAPI to client. Handle FastAPI unavailable with clear error message. Admin-gated
- [x] Add `CREW_API_URL=http://localhost:8000` to `.env.local`

**Success criteria:** `curl localhost:3500/api/design-ops/health` returns crew status. Objectives CRUD works via API.

---

#### Phase 3: Design Ops UI

**Goal:** Full UI with sidebar nav, objectives editor, crew trigger, and agent timeline.

**New files:**
```
app/design-ops/
└── page.tsx                              # Server component (fetches objectives)
components/design/
├── design-ops-client.tsx                 # Main client component (tabs/sections)
├── design-ops-objectives.tsx             # Objectives list + add/edit/delete
├── design-ops-crew-runner.tsx            # Prompt input + run button + status
└── design-ops-timeline.tsx               # Agent message timeline display
```

**Modified files:**
```
components/design/design-sidebar.tsx      # Add "Design Ops" nav item
```

**Tasks:**

- [x] `components/design/design-sidebar.tsx` — Add to `navItems` array:
  ```typescript
  const isDesignOps = pathname.startsWith("/design-ops");
  // In navItems array, after Insights, before separator:
  { href: "/design-ops", icon: Brain, label: "Design Ops", active: isDesignOps }
  ```
  Import `Brain` from `lucide-react`

- [x] `app/design-ops/page.tsx` — Server component. Reads objectives from API. Passes to client component. Pattern: follow `app/research/page.tsx`

- [x] `components/design/design-ops-client.tsx` — Main client component with three states:
  - **Empty state** (no objectives): Heading, description of Design Ops, CTA to add first objective
  - **Ready state** (objectives exist, no active run): Objectives list + prompt input + "Run Crew" button
  - **Results state** (run completed or in progress): Agent timeline + objectives sidebar
  - Admin gate using `useAdmin()` hook

- [x] `components/design/design-ops-objectives.tsx` — Objectives management:
  - List of objective cards (title, metric, target)
  - "Add Objective" button → inline form (title, metric, target, description)
  - Delete button per objective
  - Uses `data/objectives.json` via API

- [x] `components/design/design-ops-crew-runner.tsx` — Crew trigger UI:
  - Textarea for focus prompt (placeholder: "What should Oracle focus on?")
  - Objective checkboxes (select which to evaluate against, all selected by default)
  - "Run Crew" button with loading state (Loader2 animate-spin)
  - Health check on mount — show warning banner if FastAPI or Ollama unavailable
  - Consumes SSE stream from `/api/design-ops/run`
  - Appends `AgentMessage` objects to state as they arrive

- [x] `components/design/design-ops-timeline.tsx` — Agent message timeline:
  - Vertical timeline of cards, one per agent message
  - Each card shows:
    - Agent avatar (icon) + name (Atlas / Beacon) + timestamp
    - Subject line as card heading
    - Confidence badge: `high` = green, `medium` = yellow, `low` = red
    - Priority badge if critical
    - Body text as main content
    - Assumptions in collapsible `<details>` section
    - "Next Step" in muted text at bottom
  - Animate new cards appearing (motion fade-in)
  - Empty state: "No crew runs yet. Define objectives and trigger a synthesis."

**UI patterns to follow:**
- Card: `<Card>` from shadcn with `CardHeader`, `CardContent`
- Headings: `text-2xl font-black tracking-tight`
- Card titles: `text-xl`
- Badges: shadcn `<Badge>` with variant for confidence level
- Loading: `<Loader2 className="size-4 animate-spin" />`
- Toasts: `toast.success()` / `toast.error()` from sonner
- Active sidebar: `bg-primary text-primary-foreground font-semibold`

**Success criteria:** User can navigate to Design Ops, add objectives, type a focus prompt, run the crew, and watch agent messages stream in as a timeline.

---

#### Phase 4: Polish and Dev Workflow

**Goal:** Smooth developer experience and reliable operation.

**Tasks:**

- [x] Create `crew/start.sh` — Script to activate venv + start FastAPI: `source venv/bin/activate && uvicorn main:app --port 8000 --reload`
- [x] Update root `package.json` — Add script: `"crew": "cd crew && ./start.sh"`
- [x] Add `crew/README.md` — Setup instructions (create venv, install deps, configure .env, start)
- [x] Error states in UI:
  - FastAPI down: Yellow warning banner with "Crew service unavailable. Run `npm run crew` to start."
  - Ollama down: Yellow warning banner with "Ollama not running. Start Ollama to use Design Ops."
  - Crew error mid-run: Red error card in timeline with error message
- [x] Loading states:
  - Health check on page load (subtle indicator)
  - "Crew is thinking..." animated state while SSE stream is active
  - Agent typing indicator before each new message arrives
- [x] Add `.gitignore` entries: `crew/venv/`, `crew/.env`, `data/objectives.json`

**Success criteria:** Developer can clone repo, follow README, and have Design Ops working in under 5 minutes.

---

## Acceptance Criteria

### Functional Requirements

- [x] "Design Ops" appears in sidebar after "Insights" with Brain icon
- [x] `/design-ops` page loads with empty state when no objectives exist
- [x] User can add, view, and delete business objectives
- [x] User can type a focus prompt and select objectives to evaluate
- [x] "Run Crew" triggers the FastAPI microservice
- [x] Agent messages stream in real-time as a timeline
- [x] Each message shows: agent name, subject, confidence badge, body, assumptions, next step
- [x] Oracle frames the brief, Meridian produces synthesis with evidence references
- [x] Confidence labels (High/Medium/Low) appear on every Meridian output
- [x] Assumptions are explicitly stated in every output
- [x] Recommendations tie back to selected business objectives
- [x] Admin-only access (consistent with existing synthesis)

### Error Handling

- [x] Clear warning when FastAPI service is not running
- [x] Clear warning when Ollama is not running
- [x] Graceful handling of mid-run failures
- [x] Toast notifications for success/error states

### Non-Functional Requirements

- [x] Crew run completes in under 3 minutes for typical evidence volume
- [x] SSE streaming provides visible feedback within 10 seconds of triggering
- [x] Page follows existing Carrier design patterns (cards, badges, typography)
- [x] Works in dark mode (default theme)

## Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| qwen3.5 response quality for multi-agent | Test prompts early; fall back to simpler single-prompt if CrewAI overhead doesn't add value |
| SSE streaming complexity | Can fall back to polling/batch display if SSE proves unreliable |
| FastAPI as separate process | Document startup clearly; consider docker-compose for v2 |
| Context window overflow with large evidence sets | Meridian filters to last 30 days + relevance; test with real data volumes |
| CrewAI version instability | Pin version in requirements.txt |

## What's Deferred to V2+

- SENTRY (design system monitor), SIGNAL (trend scout), VOICE (communication) agents
- Persisting crew run results to Supabase
- Historical run access (view past crew runs)
- Expanded evidence intake (dev feedback, team learnings, interview quotes)
- User feedback on outputs (rate, flag, correct)
- Slack integration for VOICE
- Migration of existing synthesis pipelines to use Design Ops crew
- Docker-compose for service orchestration
- Objectives stored in Supabase instead of local JSON

## Example: End-to-End Crew Run

**User input:**
- Prompt: "Why are users dropping off during onboarding?"
- Selected objectives: "Increase activation rate from 40% to 50%"

**Oracle (frame_brief):**
```
FROM: design_ops_manager
TO: research_synthesizer
SUBJECT: Onboarding drop-off analysis scoped to activation rate
PRIORITY: standard
CONFIDENCE: n/a
ASSUMPTIONS: User has defined activation as completing onboarding + first action
BODY: Meridian — pull all observations and session feedback related to
onboarding. Cross-reference with the activation objective (40% → 50%).
Give me a directional read on where users are dropping and one recommendation.
Don't wait for more data.
NEXT STEP: Produce synthesis with confidence labels
```

**Meridian (synthesize):**
```
FROM: research_synthesizer
TO: design_ops_manager
SUBJECT: Onboarding drop-off — permissions modal is the bottleneck
PRIORITY: standard
CONFIDENCE: high
ASSUMPTIONS: Activation = completing onboarding flow. Drop-off measured by
session abandonment, not explicit user feedback.
BODY: 📊 Insight — Onboarding drop-off concentrates at the permissions step.
Pattern: 6/8 session observations mention confusion at the permissions modal.
3 observations specifically note users hesitating or re-reading the modal text.
No observations indicate trust concerns — this is a clarity issue, not a
consent issue.
Evidence: 6 observations (area: Onboarding), 2 session votes flagging
"confusing permissions," 1 spatial comment on the modal component.
Opportunity: Simplify the permissions modal to a progressive disclosure
pattern — request permissions in context rather than upfront. Expected impact
on activation: moderate-to-high (removing the primary friction point).
NEXT STEP: Prototype a contextual permissions flow and test with 3-5 users.
```

**Oracle (final synthesis):**
```
FROM: design_ops_manager
TO: user
SUBJECT: Recommendation — Redesign permissions to unblock activation
PRIORITY: standard
CONFIDENCE: high
ASSUMPTIONS: Activation metric is the priority KPI for this cycle.
BODY: Meridian's analysis points to the permissions modal as the primary
onboarding bottleneck. This is a clarity problem, not a trust problem — users
aren't refusing permissions, they're confused by the ask.
Recommendation: Replace the upfront permissions modal with contextual,
progressive permission requests. This directly targets your activation
objective (40% → 50%) by removing the highest-friction step.
Confidence is high — converging signals from 6 observations, 2 session votes,
and 1 spatial comment.
NEXT STEP: Create a design session in Carrier to prototype the contextual
permissions flow. Test with 3-5 users before committing.
```

## References

### Internal
- Agent specs: `docs/brainstorms/2026-03-11-design-ops-crew-agent-specs.md`
- Brainstorm: `docs/brainstorms/2026-03-11-design-ops-crew-brainstorm.md`
- Existing Ollama client: `lib/ollama.ts`
- Existing synthesis pattern: `app/api/design/research/synthesize/route.ts`
- Sidebar component: `components/design/design-sidebar.tsx`
- Research client (UI pattern): `components/design/research-client.tsx`
- Research page (server component pattern): `app/research/page.tsx`
- Design types pattern: `lib/research-types.ts`, `lib/research-hub-types.ts`

### External
- CrewAI docs: https://docs.crewai.com
- FastAPI docs: https://fastapi.tiangolo.com
- Ollama API: https://github.com/ollama/ollama/blob/main/docs/api.md
