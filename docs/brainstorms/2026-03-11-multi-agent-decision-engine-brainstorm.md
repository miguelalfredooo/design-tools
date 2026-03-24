---
date: 2026-03-11
topic: multi-agent-decision-engine
---

# Multi-Agent Decision Engine for Carrier

## What We're Building

Carrier evolves from a design research tool into a **decision engine** that connects scattered evidence (observations, dev feedback, team learnings, interview quotes) to business objectives, and outputs design recommendations tied to specific KPIs.

Multiple contributors (designers, devs, PMs) log evidence. On demand, a CrewAI agent crew synthesizes everything and proposes what to design to move metrics.

## Why This Approach

Current synthesis is siloed (4 independent one-shot Ollama calls), unvalidated, and disconnected from business goals. Teams have learnings scattered across people's heads, docs, and conversations. No central place connects evidence to outcomes.

Multi-agent approach allows specialized roles (evidence organization, pattern finding, design advising) to collaborate and cross-reference, producing higher quality, KPI-tied recommendations.

## Key Decisions

- **On demand synthesis**: User clicks "Synthesize" to trigger the crew (not automatic)
- **Local objectives storage**: Business KPIs stored as JSON locally (no new Supabase tables yet)
- **Python microservice**: FastAPI alongside Next.js for CrewAI, called from frontend
- **Local LLM**: qwen3.5 via Ollama (no API costs)
- **Multiple contributors**: Expanded intake supports observations, dev feedback, team learnings, interview quotes

## Architecture

### Agent Crew (CrewAI + Ollama/qwen3.5)

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| Evidence Collector | Organizes and categorizes all logged input | All evidence from Supabase | Categorized evidence mapped to objectives |
| Pattern Finder | Finds recurring signals, maps to objectives | Categorized evidence + objectives | Patterns with frequency, confidence, KPI links |
| Design Advisor | Proposes design interventions tied to KPIs | Patterns + objectives | Design briefs with expected metric impact |

### New UI Pages

1. **Objectives page** — define business KPIs and goals (stored in local JSON)
2. **Connections view** — evidence mapped to objectives with agent recommendations

### Expanded Evidence Intake

- UX observations (existing)
- Developer feedback
- Team learnings (from interviews, other teams)
- Interview quotes
- Screenshots, video clips

### Tech Stack Addition

- Python 3.12 + CrewAI + FastAPI (microservice at e.g. localhost:8000)
- Next.js frontend calls Python API on "Synthesize" click
- Agents read evidence from Supabase, read objectives from local JSON
- Results written back to research_insights table

## What Stays the Same

- Existing sessions, explorations, observations
- Supabase for evidence storage
- Current UI structure (Research Hub with tabs)
- Existing 4 synthesis pipelines (can coexist or be replaced incrementally)

## Open Questions

- Should agent recommendations link directly to creating new design sessions?
- How to handle conflicting evidence (e.g., dev feedback contradicts user observation)?
- Video/screenshot analysis — defer to later phase or include in v1?
- How to version/track objectives over time?

## Next Steps

→ `/workflows:plan` for implementation details
