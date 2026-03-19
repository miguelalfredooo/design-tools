# Carrier Crew System

How the CrewAI agents work, what they're told, and how they produce a synthesis.

---

## Overview

The crew is a small two-agent system built on [CrewAI](https://www.crewai.com/). It reads real evidence from Supabase (research observations, design sessions, votes, comments) and produces a structured synthesis.

The system runs as a FastAPI service (`crew/main.py`) on port 8000. The Next.js app calls it via SSE at `/run` and streams agent messages back to the UI in real time.

**Current model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)

---

## Agents

### Oracle — Chief Design Officer

| Property | Value |
|----------|-------|
| Role | Chief Design Officer |
| File | `agents/oracle.py` |
| LLM | Claude Haiku 4.5 |

**Goal**

> Orchestrate design research synthesis by framing clear briefs that connect user evidence to business objectives. Route work to specialists with precise scope. Every output must tie to a user need or business hypothesis.

**Persona**

Oracle is calm, strategic, and direct. It thinks in systems before tasks. It never reacts — it reframes. Its first question is always *"what problem are we actually solving?"*

It is grounded in three disciplines:
- **Articulating Design Decisions** — connect every output to a user goal and a business outcome
- **Closing the Loop** — treat the crew as an interconnected system, not isolated workers
- **Good Strategy / Bad Strategy** — distinguish real problems from noise

Its communication style is direct but diplomatic. It frames every work instruction as: `Objective → What we have → What we're assuming → Desired output`. It does not wait for a complete picture — it flags spinning and redirects with a sharper scope.

**What it does in a run**

Oracle runs first. It receives the user's raw prompt and the selected business objectives, then reframes them into a structured research brief. It is **explicitly told not to produce the synthesis itself** — its only job is to scope the question clearly enough that Meridian can do focused, high-quality work.

---

### Meridian — User Research & Insight Analyst

| Property | Value |
|----------|-------|
| Role | User Research & Insight Analyst |
| File | `agents/meridian.py` |
| LLM | Claude Haiku 4.5 |

**Goal**

> Synthesize user research evidence into directional findings with explicit confidence labels. Connect patterns to business objectives. Always end with a concrete recommendation.

**Persona**

Meridian is methodical, empathetic, and skeptical of easy answers. It resists the impulse to over-index on stated pain points and pushes toward underlying motivations — reading between the lines.

It is grounded in four disciplines:
- **Interviewing Users (Portigal)** — bottom-up coding: raw data → themes → opportunities, never skipping steps
- **Just Enough Research** — lean but rigorous, scale method to the question
- **Closing the Loop (Cababa)** — treat research participants as system stakeholders
- **Lean Analytics** — connect findings to the metric that matters most right now

After synthesizing, it carries a lightweight PM lens: it asks whether findings are actionable now or need more validation first.

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
| Medium | Single strong signal or clear pattern in available data |
| Low | Thin data or stated assumption — lead with the assumption, not the finding |

---

## Tasks

### Frame Brief Task

| Property | Value |
|----------|-------|
| File | `tasks/frame_brief.py` |
| Assigned to | Oracle |
| Runs in | Every crew execution |

**Input**

Oracle receives:
- User's raw prompt (the question they want answered)
- Full business objectives: title, metric, target, description

**Output Schema**

A structured brief with these fields:

- **SUBJECT** — one-line summary of the analysis focus
- **OBJECTIVE** — what business goal this serves
- **WHAT WE HAVE** — what evidence is available
- **ASSUMPTIONS** — what is being taken as given
- **DESIRED OUTPUT** — what Meridian should produce
- **SCOPE** — specific areas or time ranges to focus on

**Rules enforced**

- Make progress even with partial information
- Do not block the run because some inputs are missing
- Keep the brief concise and scannable (3–5 sentences per field)

---

### Synthesize Task

| Property | Value |
|----------|-------|
| File | `tasks/synthesize.py` |
| Assigned to | Meridian |
| Runs in | Every crew execution |

**Input**

Meridian receives:
- Analysis focus prompt (from user or Oracle's brief)
- Business objectives to map against
- Pre-fetched evidence text (observations, sessions, votes, comments)

**Output Schema**

A structured synthesis with:

- **SUBJECT** — one-line summary of the key finding
- **CONFIDENCE** — high / medium / low for the overall synthesis
- **ASSUMPTIONS** — what this analysis takes as given
- **FINDINGS** — 2–5 key patterns found in the evidence, each with:
  - Pattern description (one sentence)
  - Evidence references (which observations, sessions, or votes support this)
  - Confidence level for this specific pattern
- **OBJECTIVE MAPPING** — how findings connect to each business objective
- **RECOMMENDATIONS** — 1–3 concrete design recommendations, each tied to a specific objective and metric
- **NEXT STEPS** — what should happen next to validate or act on these findings

**Rules enforced**

- Ground synthesis in what the data actually says
- Flag inferences vs. direct findings
- Distinguish pain points from satisficing
- Never fabricate evidence — if data is thin, say so
- State assumptions explicitly
- Always include a metric target in each recommendation

---

## Tools

### Fetch Research Evidence

| Property | Value |
|----------|-------|
| File | `tools/supabase_tool.py` |
| Type | CrewAI `@tool` |

Meridian has access to a single tool: **Fetch Research Evidence**. It queries Supabase for:

- **research_observations** — tagged observations with area, body, contributor, timestamp
- **voting_sessions** — design sessions with title, description, problem, goal
- **voting_options** — options within each session
- **voting_votes** — votes per option, with optional voter comments
- **design_comments** — spatial or inline comments per session

**Parameters**

```python
fetch_evidence(
    topic: str = "",      # Optional: filter by area (e.g., 'onboarding', 'checkout')
    days: int = 30        # Look back N days (default 30)
) -> str
```

**Output**

Returns a formatted markdown summary of evidence found:
- Count of observations, sessions, votes, comments
- Full text of observations
- Session details (title, problem, goal)
- Options and vote counts
- Comments with voter names

If no evidence is found, the tool explicitly states that and suggests broadening the search.

---

## Execution Flow

```
POST /run { prompt, objectives }
    │
    ├── SSE: run_start
    ├── SSE: agent_start (oracle)
    │
    ├── fetch_evidence.run(...)       ← Supabase, before crew kicks off
    │                                   - Scoped to last 30 days by default
    │                                   - Returns formatted evidence text
    │
    ├── Crew.kickoff()                ← Sequential process
    │   │
    │   ├── ORACLE TASK (Frame Brief)
    │   │   - Input: prompt + objectives
    │   │   - Output: structured brief
    │   │
    │   └── MERIDIAN TASK (Synthesize)
    │       - Input: brief + evidence text + objectives
    │       - Output: structured synthesis
    │
    ├── SSE: agent_message (oracle → meridian, the brief)
    ├── SSE: agent_message (meridian → oracle, the synthesis)
    │
    └── SSE: run_complete
```

The crew always runs **sequentially** (`Process.sequential`). Oracle produces a brief, then Meridian consumes it as context for the synthesis task. There is no parallel execution or delegation between agents.

---

## Execution Details

### Sequential Process

1. **Oracle Task** runs first
   - Receives the user's raw prompt
   - Produces a structured brief
   - Scopes the analysis focus for Meridian

2. **Evidence Fetch** (runs before Meridian)
   - Queries Supabase based on Oracle's scope recommendations
   - Returns text-formatted evidence
   - Falls back gracefully if no data is found

3. **Meridian Task** runs second
   - Receives the brief from Oracle
   - Receives the evidence text from Supabase
   - Analyzes and produces the synthesis

### Error Handling

- If evidence fetch fails: Meridian receives an explicit notice and is instructed to treat data as thin, state assumptions, and proceed with directional guidance
- If Supabase is unreachable: The crew returns an error via SSE `run_complete` event
- If Oracle's brief is unclear: Meridian is instructed to proceed with its best interpretation and flag assumptions

---

## Model Configuration

Both agents use **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) via the Anthropic API.

**Environment Variables**

| Variable | Value | Location |
|----------|-------|----------|
| `ANTHROPIC_API_KEY` | Your API key | `crew/.env` (git-ignored) |

**LLM Setup**

```python
# crew/crew.py
def get_llm() -> LLM:
    return LLM(
        model="claude-haiku-4-5-20251001",
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )
```

Both Oracle and Meridian share the same LLM instance within a run.

---

## Service Entry Points

| File | Purpose |
|------|---------|
| `main.py` | FastAPI server — `/run` (SSE) and `/health` endpoints |
| `crew.py` | `run_crew(prompt, objectives)` — assembles and runs the crew |
| `start.sh` | Shell script to start the uvicorn server on port 8000 |
| `requirements.txt` | Python dependencies (crewai, anthropic, fastapi, etc.) |

**Health Check**

```
GET /health
```

Returns:

```json
{
    "status": "ok",
    "anthropic": "ok" or "unconfigured",
    "model": "claude-haiku-4-5-20251001"
}
```

---

## Integration with Carrier UI

The Next.js app calls the crew service from routes in `app/api/`:

1. User provides a prompt and selects business objectives
2. Frontend makes a POST request to `/run` with SSE subscription
3. Crew runs sequentially (Oracle → Meridian)
4. Messages stream back to the browser as `agent_message` events
5. UI renders each agent message in the Insights thread

The UI component `design-ops-crew-runner` handles SSE subscription, message parsing, and real-time rendering.

---

## Design Principles

**Two-agent simplicity**
- Oracle frames the question, Meridian answers it
- No delegation or multi-turn loops
- Single LLM model for consistency

**Evidence-grounded synthesis**
- All findings must reference actual data from Supabase
- Assumptions are stated explicitly
- Confidence labels prevent false certainty

**Progressive disclosure**
- Start with subject, confidence, top findings
- Progressively reveal assumptions, objective mapping, next steps
- Users can read at any depth level

**Actionability**
- Every recommendation is tied to a specific business objective
- Effort and cycle fit are surfaced
- Next steps are concrete, not abstract

---

## Future Evolution

Potential enhancements to the crew system:

1. **Tool expansion** — add tools for image analysis, past synthesis retrieval, or external API queries
2. **Adaptive modes** — vary evidence depth based on urgency or complexity
3. **Multi-round synthesis** — add a validation or refinement loop between agents
4. **Confidence scoring** — quantify confidence with explicit Bayesian reasoning
5. **Cost optimization** — route simpler tasks to faster models, reserve Haiku for synthesis only

For now, the two-agent sequential model keeps the system understandable and fast.
