---
date: 2026-03-11
topic: design-ops-crew
---

# Design Ops Crew for Carrier

## What We're Building

A multi-agent AI Design Ops team inside Carrier, powered by CrewAI and local Ollama (qwen3.5). Five specialized agents + one orchestrator work together to synthesize research, monitor design system health, track trends, and communicate insights — all tied to business objectives.

## Why This Approach

Design teams drown in scattered signals — research transcripts, support tickets, design system drift, competitor moves. No single person can connect all of it. A crew of specialized agents, each with a distinct role and personality, can process these inputs in parallel and produce actionable, KPI-connected recommendations on demand.

The Manager/Worker pattern (Oracle orchestrates, workers execute and communicate peer-to-peer) mirrors how real design orgs operate — but faster, always available, and with explicit confidence labeling.

## The Crew

| Agent ID | Name | Role |
|----------|------|------|
| `design_ops_manager` | **Atlas** | Design Lead / Orchestrator |
| `system_health_guardian` | **SENTRY** | Design System Integrity Monitor |
| `trend_scout` | **SIGNAL** | UX Trends & Competitive Intelligence |
| `research_synthesizer` | **Beacon** | Research Analyst |
| `slack_communicator` | **VOICE** | Communication Design & Channel Distribution |

## Key Design Decisions

- **On demand execution**: User triggers the crew, not automatic
- **Local LLM**: qwen3.5 via Ollama, no API costs
- **CrewAI + FastAPI**: Python microservice alongside Next.js
- **Manager/Worker pattern**: Oracle routes and orchestrates, workers produce independently
- **Move on partial information**: Agents don't wait for complete data — they label assumptions and output directionally
- **Peer-to-peer communication**: Workers talk to each other freely, Oracle reviews before external distribution
- **Inter-agent protocol**: Structured messages with FROM/TO/SUBJECT/PRIORITY/CONFIDENCE/ASSUMPTIONS/BODY/NEXT STEP

## Operating Principles

1. Every output connects to a user need or business hypothesis
2. Confidence is always labeled: High / Medium / Low
3. Assumptions are stated explicitly, never hidden
4. A directional insight with stated assumptions > silence waiting for certainty
5. Disagreement between agents is a signal worth keeping, not papering over

## Data Sources (v1)

- Research observations (existing in Supabase)
- Session feedback and votes (existing)
- Business objectives (local JSON)
- Team learnings, dev feedback, interview quotes (expanded intake)
- Design system component data (manual or repo scan)

## V1 Scope Decisions

- **Agents for v1:** Oracle + Meridian only (orchestrator + research synthesis)
- **VOICE:** UI only, no Slack integration — formatted output displayed in Carrier
- **UI location:** New top-level sidebar item "Design Ops"
- **SENTRY, SIGNAL, VOICE:** Deferred to v2+

## Open Questions

- How to display the inter-agent conversation in the frontend?
- Should we show the crew "thinking" in real-time or just final output?
- How does the user provide context/prompt to Oracle when triggering the crew?

## Next Steps

→ `/workflows:plan` for implementation details
