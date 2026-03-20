# Carrier — Design Synthesis System

A product-design workspace for running research sessions, synthesizing insights, and generating design recommendations using three-agent AI orchestration.

**Status:** Production-ready
**Port:** 3500 (frontend), 8000 (crew API)
**Live:** https://carrier.designtools.io *(manual deployment)*

---

## What Carrier Does

**1. Design Voting & Exploration** — Run blind voting sessions to compare design options
- Multiple design options with images, Figma embeds, or descriptions
- Anonymous voting with participant feedback
- Real-time results and spatial comments on designs

**2. Research Hub** — Synthesize observations into actionable insights
- Capture research observations tagged by area
- Group into user segments and bucket findings
- Generate insights with confidence levels

**3. Design Ops (Crew Pipeline)** — AI-powered synthesis using three agents
- **Product Manager** frames the problem and surfaces assumptions
- **Research & Insights** pressure-tests assumptions against data
- **Product Designer** proposes solutions to validate highest-risk assumptions

---

## Quick Start

### Prerequisites
- **Node.js** 18+ (frontend)
- **Python** 3.13.x (crew API — CrewAI requires ≤3.13)
- **Anthropic API key** (for Claude Haiku 4.5)

### Setup

**Option 1: Automated Setup**
```bash
bash setup-crew-venv.sh
```

**Option 2: Manual Setup**
```bash
# 1. Frontend dependencies
npm install

# 2. Crew API environment
python3.13 -m venv crew_venv
source crew_venv/bin/activate
pip install -r crew/requirements.txt

# 3. Verify
python -c "import crewai; print('✅ crewai ready')"
```

### Running

```bash
# Terminal 1: Frontend (port 3500)
npm run dev

# Terminal 2: Crew API (port 8000)
source crew_venv/bin/activate
ANTHROPIC_API_KEY="sk-ant-..." python -m uvicorn crew.main:app --host 0.0.0.0 --port 8000
```

Open **http://localhost:3500** in your browser.

**Check API health:** http://localhost:8000/health

---

## Core Workflows

### 1. Create a Design Voting Session
1. Click "New Session" from home
2. Add 2+ design options (title, description, media)
3. Share link with participants
4. Participants vote (anonymous)
5. View results when voting closes

**Use case:** Compare design directions, gather stakeholder feedback, test hypotheses

### 2. Synthesize Research Observations
1. Add observations to the Research hub
2. Group into user segments (e.g., "Mid-tier creators")
3. Bucket findings (Needs, Pain Points, Opportunities, Insights)
4. View confidence-tagged insights

**Use case:** Move from raw research to actionable findings

### 3. Run Design Ops (Crew Synthesis)
1. Provide problem statement, objective, and data
2. Select synthesis tier: **⚡ Quick** | **⚙️ Balanced** | **🔬 In-Depth**
3. Agents run sequentially (PM → Research → Designer)
4. Read tier-specific synthesis cards with design recommendations

**Use case:** Structured design thinking, hypothesis testing, design validation

---

## Documentation

📚 **[Complete Documentation Index →](./docs/README.md)**

Quick links to key docs:

| Document | Purpose |
|----------|---------|
| [CREW_HANDOFF_SPEC.md](./CREW_HANDOFF_SPEC.md) | Agent handoff contract & lifecycle stages |
| [crew/JSON_SCHEMA_VALIDATION.md](./crew/JSON_SCHEMA_VALIDATION.md) | Agent output validation & debugging |
| [crew/ITERATION_LOOP.md](./crew/ITERATION_LOOP.md) | Multi-pass synthesis capability |
| [crew/README.md](./crew/README.md) | Crew API setup & troubleshooting |
| [docs/DESIGN_PRINCIPLES.md](./docs/design-principles.md) | Design philosophy & quality facets |
| [docs/PRODUCT_REQUIREMENTS.md](./docs/carrier-prd.md) | Product spec & requirements |
| [.planning/codebase/](./planning/codebase/) | Architecture & code organization |

---

## Architecture at a Glance

```
Frontend (Next.js 16 + React 19)
├── app/page.tsx                    # Home (voting sessions)
├── app/explorations/[id]/          # Voting session detail
├── app/design-ops/                 # Crew runner interface
├── app/research/                   # Research hub (observations → insights)
├── app/flow/                       # Quick problem framing
└── lib/design-store.tsx            # Session state (Context API)

Backend (Python + CrewAI)
├── crew/main.py                    # FastAPI server (port 8000)
├── crew/crew.py                    # Three-agent orchestration
├── crew/agents/                    # PM, Research, Designer definitions
├── crew/schemas.py                 # JSON validation per agent
└── crew/tasks/                     # Task definitions

Database (Supabase PostgreSQL)
├── voting_sessions, voting_options, voting_votes
├── research_observations, research_segments
├── research_segment_items, research_insights
└── design_comments, voting_reactions
```

---

## Key Concepts

### Synthesis Tiers
- **⚡ Quick:** Fast feedback, headlines + bullets
- **⚙️ Balanced:** Structured synthesis (default), findings + evidence + next steps
- **🔬 In-Depth:** Thorough analysis, alternatives considered + risks

### Confidence Levels
- **Known:** Observed in behavior, multiple sources
- **Probable:** Consistent self-report, one source
- **Assumed:** No data, logical inference only

### Gate Checks
Each agent can **fail its gate** and stop the crew if:
- **PM:** Problem not specific enough, user unclear, no measurable outcome
- **Research:** Cannot assess highest-risk assumption
- **Designer:** Hard constraints violated, unfeasible within timeline

---

## Development

### Running Tests
```bash
npm test
```

### Code Organization
- **Voting system:** `components/design/voting-*.tsx`
- **Research hub:** `components/design/research-client.tsx`
- **Crew UI:** `components/design/design-ops-*.tsx`
- **Synthesis cards:** `components/design/synthesis-cards/`
- **API client:** `lib/design-api.ts`

### Adding a New Endpoint
1. Create route in `app/api/design/<feature>/route.ts`
2. Add to `lib/design-api.ts` client wrapper
3. Add corresponding React hook if needed
4. Update `API_REFERENCE.md`

---

## Deployment

**Prerequisites:**
- Netlify account (connected to GitHub)
- Supabase project (database & auth)
- Anthropic API key (crew service)

**Production Deploy:**
```bash
# Merge to main, then:
npx netlify deploy --prod
```

**Note:** Carrier does NOT auto-deploy from GitHub. Manual deploy is required.

**Verify deployment:**
1. https://carrier.designtools.io/ loads
2. Voting sessions create successfully
3. Crew API responds at /health endpoint

---

## Troubleshooting

### Port already in use
```bash
lsof -i :3500  # or :8000
kill -9 <PID>
```

### CrewAI import error
Ensure Python 3.13 is active:
```bash
source crew_venv/bin/activate
python --version  # Must be 3.13.x
```

### Supabase connection fails
Check `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Crew API health check fails
```bash
# Verify API is running on port 8000
curl http://localhost:8000/health

# Check logs for validation errors
# Look for "JSON_DECODE_ERROR" or "VALIDATION_ERROR"
```

---

## Git Workflow

**Always work on a feature branch:**
```bash
git checkout -b feat/your-feature
# ... make changes ...
git commit -m "feat: description"
git push -u origin feat/your-feature
```

**Before merging:**
1. All tests pass: `npm test`
2. No ESLint errors: `npm run lint`
3. Create PR with clear description
4. Get code review
5. Merge to main
6. Deploy: `npx netlify deploy --prod`

---

## Architecture Decisions

| Decision | Reasoning |
|----------|-----------|
| React Context for state | Simple session management, no Redux needed |
| FastAPI for crew | Fast, async-ready, minimal boilerplate |
| Pydantic validation | Enforces agent output consistency |
| Sequential agent execution | Clearer handoff, easier to debug than parallel |
| SSE for crew streaming | Real-time UI updates without WebSockets complexity |

---

## Performance & Costs

- **Crew API:** Claude Haiku 4.5 (fastest & cheapest Claude model)
- **Frontend:** React Compiler enabled for faster renders
- **Database:** Supabase PostgreSQL with RLS for security
- **Typical crew run:** 5-15 seconds depending on tier

---

## Contributing

1. Read [design-principles.md](./docs/design-principles.md)
2. Understand [CREW_HANDOFF_SPEC.md](./CREW_HANDOFF_SPEC.md)
3. Follow code organization patterns
4. Add tests for new features
5. Update relevant docs before merging

---

## Support

- **API Reference:** See [API_REFERENCE.md](./API_REFERENCE.md)
- **Database Schema:** See [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md)
- **Crew Setup Issues:** See [crew/TROUBLESHOOTING.md](./crew/TROUBLESHOOTING.md)
- **Agent Details:** See [crew/AGENTS.md](./crew/AGENTS.md)

---

## Documentation Map

- **Overview:** You are here (README.md)
- **Crew System:** [CREW_HANDOFF_SPEC.md](./CREW_HANDOFF_SPEC.md) → [crew/AGENTS.md](./crew/AGENTS.md) → [crew/JSON_SCHEMA_VALIDATION.md](./crew/JSON_SCHEMA_VALIDATION.md)
- **API:** [API_REFERENCE.md](./API_REFERENCE.md) → [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md)
- **Design:** [docs/design-principles.md](./docs/design-principles.md) → [docs/PRODUCT_REQUIREMENTS.md](./docs/PRODUCT_REQUIREMENTS.md)
- **All Docs:** [docs/README.md](./docs/README.md)

---

**Last updated:** 2026-03-19
**Maintained by:** Miguel Arias
