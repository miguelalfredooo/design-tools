# Carrier Crew System

How the three-agent crew works, what they're told, and how they synthesize information at different product lifecycle stages.

---

## Overview

The crew is a **three-agent system** built on [CrewAI](https://www.crewai.com/). It synthesizes evidence from multiple sources (Snowflake SQL, surveys, design sessions, prototype tests) and produces structured recommendations grounded in data.

The system runs as a FastAPI service (`crew/main.py`) on port 8000. The Next.js app calls it via SSE at `/run` and streams agent messages back to the UI in real time.

**Architecture:** Product Manager → Research & Insights → Product Designer (sequential)
**Current model:** Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
**Data sources:** Snowflake (SQL), Supabase (observations, design sessions, votes), surveys, prototype tests, images

---

## Agents

### Product Manager

| Property | Value |
|----------|-------|
| Role | Product Manager |
| File | `agents/pm.py` |
| LLM | Claude Haiku 4.5 |

**Goal**

> Frame product strategy by connecting user evidence to business objectives. Establish clear success metrics, constraints, and the business case. Every decision must tie to measurable impact.

**Persona & Grounding**

The PM is strategic, metric-driven, and clear about trade-offs. It thinks in systems: how do our decisions cascade across the product, org, and market?

Grounded in:
- **Lean Analytics (Ries & Croll)** — connect every finding to a KPI that moves the business
- **Closing the Loop (Cababa)** — understand full system impact, not just direct user effects
- **Good Strategy / Bad Strategy** — distinguish real market needs from feature requests
- **Viability** — assess technical feasibility, timeline, resource trade-offs

**What it does**

PM runs first. It frames the business objective, constraints, and success criteria. It doesn't wait for perfection — it sets clear direction with stated assumptions. Example questions:
- "What metric are we moving?"
- "What's the technical constraint here?"
- "Can we ship this in the timeline?"

---

### Research & Insights Analyst

| Property | Value |
|----------|-------|
| Role | Research & Insights Analyst |
| File | `agents/research_insights.py` |
| LLM | Claude Haiku 4.5 |

**Goal**

> Synthesize all available evidence into directional findings with explicit confidence levels. Ground recommendations in data. Distinguish findings from assumptions.

**Persona & Grounding**

Research & Insights is methodical, skeptical of easy answers, and rigorous about evidence. It resists over-indexing on pain points and pushes toward underlying motivations.

Grounded in:
- **Interviewing Users (Portigal)** — bottom-up coding: raw data → themes → opportunities, never skip steps
- **Just Enough Research** — lean but rigorous, scale depth to the question
- **Closing the Loop (Cababa)** — understand the full system, who's affected, what cascades
- **Lean Analytics** — connect findings to business metrics

**What it does**

Research & Insights synthesizes all available data: SQL results, surveys, design sessions, prototype tests, observations. It applies a fast two-pass method:
1. What does the data actually show? (direct findings)
2. What might it mean? (inferences + assumptions)

Confidence tiers:
- **High** — converging signals across multiple sources (data + survey + behavior)
- **Medium** — single strong signal from reliable source
- **Low** — thin data or stated assumption (lead with "Assuming...")

---

### Product Designer

| Property | Value |
|----------|-------|
| Role | Product Designer |
| File | `agents/product_design.py` |
| LLM | Claude Haiku 4.5 |

**Goal**

> Propose design solutions that are desirable (user experience), feasible (technically and within constraints), and aligned with product objectives. Evaluate trade-offs and surface risks.

**Persona & Grounding**

Product Designer is focused on delightful, usable experiences while understanding real-world constraints. It balances user needs with business viability and thinks in systems.

Grounded in:
- **Desirability** — does this solve the user's actual problem? Is it intuitive?
- **Feasibility** — can we build this in the timeline with available resources?
- **Closing the Loop (Cababa)** — who is affected by this design? What cascades?
- **The Product Trio** — works in tight collaboration with PM and Research. Sees all three lenses.

**What it does**

Design proposes solutions grounded in research insights. It names trade-offs clearly: "This approach is faster to ship but has less delight." It considers existing prototypes and stakeholder votes. When deviating from consensus, it explains why and what it's optimizing for.

---

## Input Schema (Modular)

The crew accepts flexible, optional inputs. Different combinations enable different product lifecycle stages.

```json
{
  "stage": "discovery|validation|solution|optimization",
  "synthesis_tier": "quick|balanced|in-depth",

  "problem_statement": "Users struggle with...",
  "objective": "Improve X to Y",
  "hypothesis": "If we do X, Y will increase by Z",
  "user_segment": "Mobile users, new customers",
  "metric": "Checkout completion rate",

  "constraints": {
    "timeline": "4 weeks",
    "technical": "Must use existing payment provider",
    "scope": "Search results page only"
  },

  "research_data": {
    "snowflake_results": "SQL query results",
    "survey_responses": "Survey feedback",
    "supabase_observations": "Research observations",
    "prototypes_tested": [
      {
        "name": "Auto-fill form",
        "votes": 9,
        "comments": ["Faster", "Privacy concern"]
      }
    ],
    "images": [
      {
        "url": "figma-link",
        "description": "Current checkout flow"
      }
    ]
  }
}
```

**No field is required.** The crew gracefully handles missing data and always produces actionable output.

### Synthesis Tier

The `synthesis_tier` parameter controls output depth without changing the underlying analysis:

| Tier | Output Style | Use Case | Speed |
|------|--------------|----------|-------|
| **quick** | Snappy, 2-3 patterns, bullets | Fast feedback loops, gut-checking | Fastest |
| **balanced** (default) | Structured synthesis, findings + next steps | Standard analysis, most runs | Standard |
| **in-depth** | Thorough, competing interpretations, detailed reasoning | Foundational decisions, contradictions | Slightly slower |

**Key principle:** All tiers analyze the same data. Tier only affects _narrative structure_ and _depth of reasoning_, not data completeness.

---

## Lifecycle Stages

### Discovery
**Input:** Problem statement + User segment (minimal)
**Output:** Findings + Opportunities + Hypotheses to test
**Agents:** PM frames + Research synthesizes
**Design runs?** No — focus on understanding before solution design

### Validation
**Input:** Hypothesis + Metric + Data (SQL, surveys, prototypes)
**Output:** Hypothesis supported/refuted + Confidence + Next steps
**Agents:** PM frames + Research synthesizes + Design evaluates feasibility
**Use case:** Testing if a hypothesis holds before committing resources

### Solution
**Input:** Objective + Metric + Constraints + Data
**Output:** Design recommendation + Trade-offs + Implementation approach
**Agents:** All three (PM → Research → Design)
**Use case:** Planning a solution after validation

### Optimization
**Input:** Current metric + Constraints + Data
**Output:** Lever + Expected impact + Effort estimate
**Agents:** All three
**Use case:** Squeezing more from an existing feature

---

## Execution Flow

```
POST /run { stage, synthesis_tier, problem_statement, metric, research_data, ... }
    │
    ├── SSE: run_start (includes synthesis_tier)
    ├── SSE: agent_start (pm)
    │
    ├── Crew.kickoff() (sequential)
    │   │
    │   ├── PM TASK
    │   │   ├─ Input: problem_statement, objective, metric, constraints
    │   │   └─ Output: framed objective + success criteria (tier-agnostic)
    │   │
    │   ├── RESEARCH & INSIGHTS TASK (TIER-AWARE)
    │   │   ├─ Input: PM frame + research_data + synthesis_tier
    │   │   ├─ Quick: 2-3 key patterns (bullets, minimal reasoning)
    │   │   ├─ Balanced: structured synthesis (findings + confidence + next steps)
    │   │   └─ In-depth: all patterns + competing interpretations + detailed assumptions
    │   │
    │   └─ [if stage != discovery] DESIGN TASK (TIER-AWARE)
    │       ├─ Input: research synthesis + constraints + synthesis_tier
    │       ├─ Quick: direction + 2 key trade-offs only
    │       ├─ Balanced: direction + interactions + trade-offs + feasibility
    │       └─ In-depth: full recommendation + alternatives considered + risks + mitigations
    │
    ├── SSE: agent_message (each agent's output)
    │
    └── SSE: run_complete
```

**Sequential process:** PM → Research → Design (no parallel execution, no delegation)

**Tier adaptation:** Research & Insights and Design adapt their output structure based on `synthesis_tier`. The PM always frames strategically—tiers don't affect business-level framing.

---

## Data Sources & Tools

### Fetch Research Evidence (Supabase)

Research & Insights has access to query:
- `research_observations` — tagged observations (area, body, contributor)
- `voting_sessions` — design sessions (title, problem, goal)
- `voting_options` — design options within sessions
- `voting_votes` — votes per option with voter names
- `design_comments` — spatial/inline comments on sessions

### External Data (User-Provided)

User provides via `research_data`:
- **Snowflake results** — SQL query outputs (funnel drop-off, cohort analysis, etc.)
- **Survey responses** — qualitative feedback, open-ended responses
- **Prototype tests** — test results + prototype references
- **Images/Mockups** — design references from Figma

---

## Modular & Graceful Degradation

**Core principle:** Always forward momentum, even with incomplete data.

```
Input: Problem statement only
├─ PM: "Here's what we need to know to make a decision"
└─ Output: "Next step: gather data on X, Y, Z"

Input: Problem + Metric + SQL data
├─ PM: "This metric matters, data shows..."
├─ Research: "Here's what the data supports + assumptions"
└─ Output: "Try approach X. Validate with Z."

Input: Full context (all fields)
├─ All three agents run fully
└─ Output: Full recommendation with design direction + trade-offs
```

---

## Voting Integration

**Carrier's design voting mechanism** is read-only in the crew:

- Research & Insights pulls voting data from Supabase
- Surfaces stakeholder consensus as evidence ("Option C won 9/20 votes")
- Design agent acknowledges consensus and builds on it when possible
- When Design deviates from consensus, it explains why

**Voting stays in Carrier.** The crew synthesizes the votes, doesn't create new ones.

---

## Model Configuration

Both agents use **Claude Haiku 4.5** for speed and cost efficiency.

```python
# crew/crew.py
def get_llm() -> LLM:
    return LLM(
        model="claude-haiku-4-5-20251001",
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )
```

**Environment:** `crew/.env` (git-ignored)

---

## Service Entry Points

| File | Purpose |
|------|---------|
| `main.py` | FastAPI server — `/run` (SSE) and `/health` endpoints |
| `crew.py` | `run_crew(...)` — flexible API for three-agent synthesis |
| `agents/` | Three agent definitions (PM, Research, Design) |
| `tasks/` | Three tasks (Frame Objective, Synthesize, Recommend Solution) |
| `tools/supabase_tool.py` | Fetch Research Evidence tool |
| `start.sh` | uvicorn server startup |

**Health Check**
```
GET /health
→ { "status": "ok", "anthropic": "ok", "model": "claude-haiku-4-5-20251001" }
```

---

## Integration with Carrier UI

The Next.js app calls the crew at different points in the workflow:

1. **Discovery phase** — User provides problem + data → Crew synthesizes → UI shows findings
2. **Validation phase** — User tests hypothesis → Crew analyzes results → UI shows confidence
3. **Solution phase** — User has validated hypothesis → Crew proposes design → UI shows recommendation
4. **Optimization phase** — User wants to improve existing feature → Crew identifies lever

The UI component `design-ops-crew-runner` handles:
- SSE subscription to `/run`
- Message parsing and streaming
- Real-time rendering of agent outputs

---

## Design Principles

**Modular & flexible**
- Any combination of inputs works
- Agents gracefully handle missing data
- Always produce actionable output

**Evidence-grounded**
- All findings reference actual data
- Assumptions stated explicitly
- Confidence labels prevent false certainty

**Progressive disclosure**
- Headline first (what matters)
- Details available (data, sources, assumptions)
- Users control depth of dive

**Forward momentum**
- Never block on missing data
- Always suggest next step
- "Directional with assumptions" > silence

**Three-discipline collaboration**
- PM owns viability (business, metrics, timeline)
- Research owns evidence (data, patterns, confidence)
- Design owns desirability (UX, trade-offs, feasibility)
- All three see the full picture

---

## Recent Changes

**Synthesis Tiers (v1.1):**
- Added `synthesis_tier` parameter: quick, balanced (default), in-depth
- Research & Insights and Design adapt output depth based on tier
- Same data analysis, different narrative structure per tier
- Keeps output snappy by default while supporting deeper dives when needed

## Future Evolution

1. **Tool expansion** — add tools for competitor analysis, past synthesis retrieval, external APIs
2. **Streaming synthesis** — output findings as they're discovered, not all at once
3. **Auto-escalation to in-depth** — detect contradictions or low confidence and suggest deeper synthesis
4. **Tier UI selector** — let users pick tier at session creation or suggest based on complexity
5. **Recursive synthesis** — agents iterate on findings if confidence is low
6. **Cost optimization** — use faster models for framing, reserve Haiku for complex synthesis
7. **Citation tracking** — agents explicitly cite which book/framework informed each recommendation

For now: three-agent sequential model keeps the system understandable, fast, and maintainable.
