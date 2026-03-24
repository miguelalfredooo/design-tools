# Carrier Crew System

How the CrewAI agents work, what they're told, and how they produce a synthesis.

---

## Overview

The crew is a small two-agent system built on [CrewAI](https://www.crewai.com/). It reads real evidence from Supabase (research observations, design sessions, votes, comments) and produces a structured synthesis — either a fast scan or a full design memo, depending on the mode.

The system runs as a FastAPI service (`crew/main.py`) on port 8000. The Next.js app calls it via SSE at `/run` and streams agent messages back to the UI in real time.

---

## Agents

### Design Strategy

| Property | Value |
|----------|-------|
| Role | Design Lead |
| File | `agents/design_strategy.py` |
| Active in modes | `deep_dive`, `decision_memo` (skipped in `quick_read`) |

**Goal**

> Orchestrate design research synthesis by framing clear briefs that connect user evidence to business objectives. Route work to specialists with precise scope. Every output must tie to a user need or business hypothesis.

**Backstory / Persona**

Design Strategy is calm, strategic, and direct. It thinks in systems before tasks. It never reacts — it reframes. Its first question is always "what problem are we actually solving?"

It is grounded in three disciplines:
- **Articulating Design Decisions** — connect every output to a user goal and a business outcome
- **Closing the Loop** — treat the crew as an interconnected system, not isolated workers
- **Good Strategy / Bad Strategy** — distinguish real problems from noise before deploying effort

Its communication style is direct but not blunt. It frames work as: `Objective → What we have → What we're assuming → Desired output`. It does not wait for a complete picture — it flags gaps and redirects with a sharper scope.

**What it does in a run**

Design Strategy runs first. It receives the user's raw prompt and the selected business objectives, then rewrites them into a structured research brief. It is explicitly told not to produce the synthesis itself — its only job is to scope the question clearly enough that Research & Insights can do focused work.

---

### Research & Insights

| Property | Value |
|----------|-------|
| Role | Research Analyst |
| File | `agents/research_insights.py` |
| Active in modes | All three modes |

**Goal**

> Synthesize user research evidence into directional findings with explicit confidence labels. Connect patterns to business objectives. Always end with a concrete recommendation.

**Backstory / Persona**

Research & Insights is methodical, empathetic, and skeptical of easy answers. It resists over-indexing on stated pain points and pushes toward underlying motivations — reading between the lines.

It is grounded in four disciplines:
- **Interviewing Users (Portigal)** — bottom-up coding: raw data → themes → opportunities, never skipping steps
- **Just Enough Research** — lean but rigorous, scale method to the question
- **Closing the Loop (Cababa)** — treat research participants as system stakeholders
- **Lean Analytics** — connect findings to the metric that matters most right now

It also carries a lightweight PM lens: after synthesizing, it always asks whether a finding is actionable now or needs more validation first. It flags effort signal (low / medium / high) and cycle fit in 1–2 lines.

**Core behaviors**
- Ingest whatever is available — partial sets are fine
- Apply fast two-pass analysis: what's in the data → what does it likely mean
- Never wait for statistical significance — output directional findings with confidence labels
- Distinguish pain points from satisficing (users who have quietly adapted to something broken)
- Always end with one concrete opportunity or recommendation — never a dead-end finding

**Confidence tiers**

| Level | Meaning |
|-------|---------|
| High | Converging signals across multiple sources |
| Medium | Single strong signal |
| Low | Thin data or stated assumption — lead with the assumption, not the finding |

---

## Tasks

### Frame Brief

| Property | Value |
|----------|-------|
| File | `tasks/frame_brief.py` |
| Assigned to | Design Strategy |
| Runs in | `deep_dive`, `decision_memo` |

Design Strategy is given the user's prompt and the full business objectives (title, metric, target, segments, lifecycle cohorts, theory of success). It is asked to produce a structured brief with these fields:

- **SUBJECT** — one-line summary of the analysis focus
- **OBJECTIVE** — what business goal this serves
- **SEGMENT** — which segment or segment hypothesis this applies to
- **USER STAGE** — which behavior stage this applies to
- **PHASE** — which growth phase: Learning / Scaling / Expansion / Optimization
- **READINESS** — sufficient / partial / weak, with one sentence explaining why
- **WHAT WE HAVE** — what evidence is available
- **ASSUMPTIONS** — what is being taken as given
- **DESIRED OUTPUT** — what Research & Insights should produce
- **METRIC TO MOVE** — which KPI this should influence
- **SCOPE** — specific areas or time ranges to focus on
- **WHAT WOULD IMPROVE CONFIDENCE** — 1–3 additional signals worth gathering

Rules enforced in the prompt: make progress even with partial information, do not block the run because some inputs are missing, keep the brief concise and scannable.

---

### Synthesize

| Property | Value |
|----------|-------|
| File | `tasks/synthesize.py` |
| Assigned to | Research & Insights |
| Runs in | All three modes |

Research & Insights receives: the analysis focus prompt, business objectives, and the pre-fetched evidence text. It applies its two-pass method and produces a synthesis.

The output schema differs by mode.

**Full output (deep_dive / decision_memo)**

- SUBJECT, DETAILS, CONFIDENCE, READINESS
- TOP FINDINGS (3 bullets), TOP NEEDS (3 bullets)
- RECOMMENDATION tied to a segment + metric
- PHASE with one sentence of reasoning
- ASSUMPTIONS
- FINDINGS — 2–5 patterns, each with: pattern description, evidence references, segment relevance, user stage relevance, confidence level
- OBJECTIVE MAPPING — how findings connect to each business objective
- ADDITIONAL SIGNALS WORTH GATHERING — 1–3 missing inputs with source and why
- RECOMMENDATIONS — 1–3 concrete design recommendations tied to specific objectives
- NEXT STEPS
- PRIORITIZATION NOTE — effort signal + cycle fit, 1–2 lines

**Lean output (quick_read)**

- SUBJECT, DETAILS, CONFIDENCE, READINESS
- TOP FINDINGS (3 bullets), TOP NEEDS (3 bullets)
- RECOMMENDATION tied to a segment + metric
- PHASE with one sentence of reasoning
- NEXT STEP (singular)
- PRIORITIZATION NOTE

Rules enforced in the prompt: ground synthesis in what the data actually says, flag inferences vs. direct findings, distinguish pain points from satisficing, never fabricate evidence, state assumptions explicitly, always include segment + metric in the recommendation.

---

## Tools

### Fetch Research Evidence

| Property | Value |
|----------|-------|
| File | `tools/supabase_tool.py` |
| Type | CrewAI `@tool` |

Runs before the crew kicks off (called directly in `crew.py`, not delegated to an agent). Queries Supabase for:

- `research_observations` — tagged observations with area, body, contributor
- `voting_sessions` — design sessions with title, description, problem, goal
- `voting_options` — options within each session
- `voting_votes` — votes per option, with optional comments
- `design_comments` — spatial or inline comments per session

Parameters are scaled by mode:

| Mode | Days back | Session limit | Observation limit | Comments |
|------|-----------|--------------|-------------------|----------|
| quick_read | 14 | 3 | 6 | No |
| decision_memo | 21 | 4 | 8 | Yes |
| deep_dive | 30 | 6 | 12 | Yes |

If the fetch fails, the agents receive an explicit failure notice and are instructed to treat the data as thin and state assumptions explicitly.

---

## Modes

Three synthesis modes select the depth of the run.

### quick_read

- Design Strategy is skipped entirely
- Only Research & Insights runs
- Evidence window is narrower (14 days, 3 sessions)
- Output is lean: subject, top findings, top needs, recommendation, phase, next step, prioritization note
- Purpose: fast directional scan, no strategic framing overhead

### decision_memo

- Both agents run sequentially
- Evidence window is mid-range (21 days, 4 sessions)
- Output is full but framed for a product review artifact — balanced recommendation, rationale, alternatives, risks
- Purpose: a shareable artifact for a product review or handoff

### deep_dive

- Both agents run sequentially
- Evidence window is widest (30 days, 6 sessions, 12 observations)
- Output includes rich objective mapping, evidence gaps, readiness judgment, and additional signals
- Purpose: thorough synthesis before a major design decision or cycle planning

---

## Execution Flow

```
POST /run { prompt, mode, objectives }
    │
    ├── SSE: run_start
    ├── SSE: agent_start (design_strategy or research_insights, depending on mode)
    │
    ├── fetch_evidence.run(...)          ← Supabase, before crew kicks off
    │
    ├── [mode != quick_read]
    │   ├── create_design_strategy(llm)
    │   ├── create_frame_brief_task(...)
    │   └── SSE: agent_message (design_strategy → research_insights)
    │
    ├── create_research_insights(llm)
    ├── create_synthesize_task(...)
    │
    ├── Crew.kickoff()                   ← sequential process
    │
    ├── SSE: agent_message (research_insights → design_strategy, the synthesis)
    ├── [mode != quick_read]
    │   └── SSE: agent_message (design_strategy → user, wrap-up)
    │
    └── SSE: run_complete
```

The crew always runs sequentially (`Process.sequential`). There is no parallel execution or delegation between agents — Design Strategy produces a brief, then Research & Insights consumes it as context for the synthesis task.

---

## Model Configuration

The LLM is configured via environment variables. Two providers are supported:

| Variable | Default |
|----------|---------|
| `CREW_MODEL_PROVIDER` | `openai` |
| `OPENAI_CREW_MODEL` | `gpt-5.1-codex-mini` |
| `ANTHROPIC_CREW_MODEL` | `claude-haiku-4-5-20251001` |

Both agents share the same LLM instance within a run. Token limit for Anthropic provider is capped at 4096.

---

## Service Entry Points

| File | Purpose |
|------|---------|
| `main.py` | FastAPI server — `/run` (SSE) and `/health` |
| `crew.py` | `run_crew(prompt, objectives, mode)` — assembles and runs the crew |
| `start.sh` | Shell script to start the uvicorn server |
| `requirements.txt` | Python dependencies |

The Next.js app calls the crew service from `app/api/` routes, which proxy the SSE stream to the browser. The UI renders agent messages as they arrive using the `design-ops-crew-runner` component.
