# Carrier (design-tools) — Development Guide

## What This Project Does

Carrier is a design synthesis workspace for running research sessions, blind voting on design options, and AI-orchestrated design thinking using a three-agent CrewAI pipeline. Users create voting sessions with multiple design directions, capture research observations, and synthesize insights into actionable design recommendations.

## Tech Stack

Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, FastAPI, CrewAI, Claude Haiku 4.5, Ollama (llama3.2), Supabase.

## How to Run Locally

**Terminal 1 (Frontend on 3500):**
```bash
npm install && npm run next:dev
```

**Terminal 2 (Crew API on 8000):**
```bash
source crew_venv/bin/activate
PYTHONPATH=$(pwd) python crew/main.py
```

Requires: Node 20 (.nvmrc), Python 3.13.x (.crew-python-version), ANTHROPIC_API_KEY from ~/.env.global.

## Folder Structure

```
crew/              # Python CrewAI pipeline (PM → Research → Designer agents)
app/tools/design/  # Carrier routes (projects, research, voting)
lib/design-store.tsx  # Session context + Supabase
components/design/ # Sidebar, research hub, session UI
supabase/         # Database schema (separate instance)
docs/             # API_REFERENCE.md, CREW_HANDOFF_SPEC.md, SUPABASE_SCHEMA.md
```

## Key Architectural Decisions

- **Dual runtime:** Node.js frontend + Python crew API (CrewAI requires Python ≤3.13)
- **Three-agent handoff:** PM → Research → Designer (explicit question-passing)
- **Separate Supabase:** Uses own instance, not shared with nooooowhere-club
- **Ollama + Claude split:** llama3.2 for fast synthesis, Claude for high-quality output
- **Sidebar layout:** Fixed 208px sidebar with content taking remaining width

## Connections to Other Projects

**← nooooowhere-club:** Research insights feed curator voice patterns
**← nooooowhere-club-rn:** Shares CrewAI three-agent patterns; both use Claude vision
**→ No connection:** alfredo-studio is independent

**Shared:** Anthropic API key (same account, shared rate limits)

## What NOT to Change Without Asking

- Agent names/roles (PM/Research/Designer — explicit in handoff spec)
- Sidebar width (208px, affects layout calculations)
- Python version (must be ≤3.13 for CrewAI)
- RLS policies (controls session ownership)
- Vote anonymity (no user_id in votes table)

## Common Commands

```bash
npm run dev              # Frontend + crew in parallel
npm run next:dev        # Frontend only
npm run crew:start      # Crew API only
supabase db reset       # Reset local schema
curl http://localhost:8000/health  # Check crew
```

See docs/ for full API, crew handoff spec, and schema details.

**GitHub:** https://github.com/miguelalfredooo/design-tools
