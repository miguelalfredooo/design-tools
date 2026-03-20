# Carrier Design Agents: Handoff-Driven Spec

> Each agent answers the previous agent's unresolved question.
> **PM surfaces risk → Research pressure-tests it → Designer validates the highest-risk assumption first.**

**For detailed agent personas & system prompts, see [crew/AGENTS.md](./crew/AGENTS.md)**

---

## How the Loop Works

```
PM → "here's the highest-risk assumption"
      ↓
Research → "here's what would prove us wrong"
      ↓
Designer → "here's what to prototype first and how to know if it works"
```

**No agent produces a document. Each agent produces a handoff.**

---

## Agent 1: PM (Product Manager)

**Role:** Frame whether this is worth solving. Surface what we don't know. Hand Research a ranked list of assumptions.

### Inputs

```
problem_statement:  [one sentence — specific, not broad]
user_segment:       [specific role/moment, not broad cohort]
metric:             [one measurable outcome if we succeed]
why_now:            [market condition, constraint, or trigger]
constraints:        [timeline / technical / scope — hard limits only]
stage:              [discovery | validation | solution | optimization]
```

Missing fields are **data**. If `why_now` is blank, that's the first output — not a workaround.

### Gate Check

Answer these before framing anything:

1. **Is the problem specific enough to design against?**
   (Not "improve search experience" — "users can't find X in Y scenario")

2. **Do we know who specifically suffers from this — or are we assuming?**
   (Not "people" — "new mobile users on iOS")

3. **Is there a measurable outcome, or is this a feeling?**
   (Metric, not vibes)

4. **Why does this need to be solved now vs. next quarter?**
   (Market window, retention cliff, roadmap constraint, etc.)

**If any gate fails:** Name the gap. Do not proceed to framing.
**If all gates pass:** Continue to output.

### Output (only if gates pass)

**Strategic frame** (3 lines max)
- Problem in one sentence
- User in one phrase
- Outcome in one number

**Business case** (2 sentences max)
- Why this? Why now?

**Assumptions handoff to Research** (the core output)
- 3–5 assumptions this brief rests on
- Each tagged: `HIGH` / `MED` / `LOW` risk-if-wrong
- For each `HIGH`: one sentence on **what would prove us wrong**

**Hard constraints**
- Non-negotiable limits (time, tech, scope, people)

**What we're NOT solving**
- One explicit trade-off decision

### Contract

Research reads the ranked assumptions and pressure-tests them against data.
Designer reads the hard constraints and pressure-tests feasibility.

---

## Agent 2: Research & Insights

**Role:** Tell the team what we actually know, what we're assuming, and where we'd be wrong to move forward.

### Inputs

```
pm_assumptions:       [ranked list from PM — required]
research_data:        [any of the following]
  quantitative:       [Snowflake / analytics results]
  qualitative:        [interview notes / observations]
  survey:             [responses or themes]
  prototype_results:  [what was tested, reactions, votes]
user_segment:         [from PM brief]
stage:                [discovery | validation | solution | optimization]
depth:                [quick | balanced | in-depth]
```

### Gate Check

Before synthesizing anything:

1. **Are we looking at behavior or self-report?**
   (Behavior = what people do. Self-report = what people say.)

2. **Is this a pain point — something that blocks progress — or a workaround — something people have already adapted to?**
   (Workaround users have adapted to is different from blocking pain.)

3. **Which PM assumptions does this data actually speak to? Which ones does it leave untouched?**
   (Not all data answers all questions.)

### Scenario A: WITH Research Data

**Synthesize against PM assumptions directly**
- For each `HIGH`-risk PM assumption: `confirm` / `contradict` / `inconclusive`
- Distinguish: what the data shows vs. what we're inferring from it
- Name one finding the team will want to dismiss — and why they shouldn't

**Confidence ratings per finding**

| Rating | Meaning |
|---|---|
| **Known** | Observed in behavior, multiple sources |
| **Probable** | Consistent self-report, one source |
| **Assumed** | No data, logical inference only |

**Pain vs. workaround call**
- Is this blocking users or have they adapted around it?
- If adapted: is the pain acute enough to motivate change?

### Scenario B: WITHOUT Research Data

- Restate the top 2 `HIGH`-risk assumptions as testable hypotheses
- Propose one specific research action per hypothesis
  *(not "do more research" — e.g. "5 contextual interviews with X role focused on Y moment in their workflow")*
- Flag what discovery mode means for the Designer: solutions should be provocations, not proposals

### Output Closes With (Always)

> To move the highest-risk assumption from **assumed → known**, we need:
> **[one specific thing — method, sample, data source]**

### Contract

Designer reads this closing line and builds a prototype to test it.

---

## Agent 3: Designer

**Role:** Propose the most direct path to validating the highest-risk assumption Research handed you.

### Inputs

```
pm_constraints:           [hard limits from PM — required]
research_assumptions:     [ranked list from Research — required]
highest_risk_assumption:  [the one that, if wrong, breaks everything]
exploration_data:         [any of the following]
  prototypes_tested:      [name, what was tested, votes or reactions]
  design_images:          [describe or attach]
  prior_consensus:        [what the team has aligned on]
user_segment:             [from PM brief]
stage:                    [discovery | validation | solution | optimization]
depth:                    [quick | balanced | in-depth]
```

### Gate Check

Before proposing anything:

1. **What user behavior is this solution assuming?**
   *(Name it explicitly — don't let it stay implicit)*

2. **Does this respect the PM's hard constraints?**
   *(If not, name the conflict before proceeding)*

3. **Is there prior exploration to build on?**
   - If yes → extend consensus, explain deviations
   - If no → discovery mode, solutions are provocations not proposals

### Scenario A: WITH Exploration Data

**Build on existing consensus:**
- Reference what was tested and what signal it produced
- Extend the direction that earned the most confidence
- If deviating from prior consensus: name why explicitly

**For each idea:**

| Field | What to answer |
|---|---|
| Specific change | What exactly changes in the interface or flow |
| Why | Which user behavior or research finding this responds to |
| Trade-off | What you lose by choosing this over the alternative *(if we do X, we give up Y — is that the right call?)*  |
| Second-order effect | One downstream consequence to monitor *(this solution may cause ___ if ___)*  |
| Feasibility | Engineering lift, honest estimate |
| Validation | What specific interaction to prototype first |

### Scenario B: WITHOUT Exploration Data (Discovery Mode)

**Solutions are provocations — concrete enough to react to, not precious enough to defend.**

**For each idea:**

| Field | What to answer |
|---|---|
| Specific interaction | Name the screen, the action, the response |
| Assumption being tested | What user behavior must be true for this to work |
| Trade-off | What this approach rules out |
| Second-order effect | One thing that could go wrong downstream |
| Prototype priority | Smallest thing to build that tests the assumption |

### Output by Depth

| Depth | Output |
|---|---|
| `quick` | One direction + the trade-off you'd be making + the next prototype to build |
| `balanced` | 2–3 ideas with craft details + prototype focus + what success looks like in testing |
| `in-depth` | Full exploration: alternatives considered, feasibility, assumption map, prototype roadmap, validation plan, risks |

### Output Closes With (Always)

**Critique anchor:**

> The objective this design serves is **[___]**.
>
> If someone pushes back, the trade-off to surface is:
> choosing **[alternative]** means giving up **[specific thing]** for the user.

### Contract

Team reads this closing line and debates the trade-off. When someone says "I disagree," the Designer can point to the trade-off and ask: "Are you willing to make that trade?"

---

## Lifecycle Stages & Synthesis Tiers

### Product Lifecycle Stages

The crew adapts its analysis based on where the product is in its development:

| Stage | Definition | PM Does | Research Does | Designer Does |
|-------|-----------|---------|---------------|---------------|
| **discovery** | "We don't know if this is real" | Frames the open question | Proposes how to answer it | Sits out (focus on understanding) |
| **validation** | "We think this is real, testing if..." | Frames the hypothesis | Synthesizes data for/against | Evaluates feasibility |
| **solution** | "This is real, designing the best way" | Frames the objective | Synthesizes all data | Recommends design direction |
| **optimization** | "It works, making it better" | Frames the lever | Synthesizes what could improve | Recommends optimization |

**How to use:** Pass `stage` param to crew. Agents tailor depth to the stage (e.g., Designer produces provocations in discovery, polished specs in solution).

### Synthesis Tiers

The `synthesis_tier` parameter controls output depth. All tiers analyze the same data—tier only affects narrative structure.

| Tier | Output Style | Use Case | Speed | When to use |
|------|--------------|----------|-------|------------|
| **quick** ⚡ | Snappy, 2-3 patterns, bullets | Fast feedback loops, gut-checking | Fastest | Early morning sync, quick validation |
| **balanced** ⚙️ | Structured synthesis, findings + evidence + next steps | Standard analysis, most runs | Standard | Default, most use cases |
| **in-depth** 🔬 | Thorough, competing interpretations, detailed reasoning | Foundational decisions, contradictions | Slightly slower | Major roadmap decisions, conflicts |

**Key principle:** All tiers use the same agents and data. Tier only affects how much detail and reasoning the agent shows. Quick is snappier, in-depth shows more deliberation.

**Example:** All tiers find that "users struggle with role selection" but:
- Quick: "Role selection is a blocker. Consider auto-detection."
- Balanced: "Role selection causes 40% abandonment. Auto-detection from email would eliminate blocker but add 15% false positives. Test first."
- In-depth: "Role selection causes abandonment. Root cause: [A], [B], [C]. Auto-detection works IF [X], [Y], [Z]. Alternatives considered: [1], [2]. Test plan: [...]."

---

## Execution Flow

```
POST /design-ops/run {
  stage: "discovery|validation|solution|optimization",
  synthesis_tier: "quick|balanced|in-depth",
  problem_statement: "...",
  metric: "...",
  research_data: {...},
  ...
}
    │
    ├── SSE: run_start (includes synthesis_tier)
    │
    ├── SSE: agent_start (pm)
    │   ├── PM AGENT
    │   │   ├─ Input: problem_statement, objective, metric, constraints, stage
    │   │   ├─ Output: strategic_frame + assumptions (tier-agnostic)
    │   │   └─ Gate: If status="fail", crew stops here
    │   │
    │   ├── SSE: agent_message (PM output)
    │
    ├── SSE: agent_start (research)
    │   ├── RESEARCH & INSIGHTS AGENT (TIER-AWARE)
    │   │   ├─ Input: PM frame + research_data + synthesis_tier + stage
    │   │   ├─ Quick: 2-3 key patterns (bullets, minimal reasoning)
    │   │   ├─ Balanced: structured synthesis (findings + confidence + next steps)
    │   │   └─ In-depth: all patterns + competing interpretations + detailed assumptions
    │   │   └─ Output: what_we_know + assumption_status + highest_risk_assumption
    │   │   └─ Gate: If highest_risk_assumption is empty, crew stops here
    │   │
    │   ├── SSE: agent_message (Research output)
    │
    ├── SSE: agent_start (design)
    │   ├── DESIGNER AGENT (if stage != discovery, TIER-AWARE)
    │   │   ├─ Input: research synthesis + constraints + synthesis_tier + stage
    │   │   ├─ Quick: direction + 2 key trade-offs only
    │   │   ├─ Balanced: direction + interactions + trade-offs + feasibility
    │   │   └─ In-depth: full recommendation + alternatives considered + risks + mitigations
    │   │   └─ Output: ideas (2-3) + objective + critique_anchor
    │   │
    │   ├── SSE: agent_message (Design output)
    │
    └── SSE: run_complete
```

**Sequential execution:** PM → Research → Designer (no parallel, handoff-driven)
**Streaming:** Each agent message sent via SSE as it completes
**Tier adaptation:** Research & Designer adapt output structure based on tier

---

## Data Sources & Tools

### Research Agent Can Access (Read-Only)

Via Supabase tool:
- `research_observations` — Tagged observations (area, body, contributor)
- `voting_sessions` — Design sessions (title, problem, goal, user segment)
- `voting_options` — Design options within sessions
- `voting_votes` — Votes per option with voter names
- `design_comments` — Spatial/inline comments on sessions

### User Provides

Via `research_data` input:
- **Snowflake results** — SQL query outputs (funnel drop-off, cohort analysis, etc.)
- **Survey responses** — Qualitative feedback, open-ended responses
- **Prototype tests** — Test results, prototype references, votes
- **Images/Mockups** — Design references from Figma or Excalidraw

**Graceful degradation:** If no external data provided, Research works from Supabase observations alone. Output is labeled "Assumed" rather than "Known," but crew still moves forward.

---

## Service Entry Points

| File | Purpose |
|------|---------|
| `crew/main.py` | FastAPI server — `/design-ops/run` (SSE) and `/health` endpoints |
| `crew/crew.py` | `run_crew(...)` — Three-agent orchestration (flexible API) |
| `crew/agents/pm.py` | PM Agent definition + system prompt |
| `crew/agents/research_insights.py` | Research Agent definition + system prompt |
| `crew/agents/product_design.py` | Designer Agent definition + system prompt |
| `crew/tasks/*.py` | Task definitions (what each agent does) |
| `crew/tools/supabase_tool.py` | Fetch evidence from Supabase |
| `crew/schemas.py` | Output validation (ensure consistent JSON) |

**Health check:**
```
GET /health
→ { "status": "ok", "anthropic": "ok", "model": "claude-haiku-4-5-20251001" }
```

---

## Integration with Carrier UI

The Next.js frontend calls the crew at different workflow points:

1. **Discovery phase** — User provides problem + data → `/design-ops/run` with `stage=discovery` → UI shows findings
2. **Validation phase** — User tests hypothesis → `/design-ops/run` with `stage=validation` → UI shows confidence level
3. **Solution phase** — User has validated hypothesis → `/design-ops/run` with `stage=solution` → UI shows design recommendation
4. **Optimization phase** — User wants to improve → `/design-ops/run` with `stage=optimization` → UI shows lever + impact estimate

**UI components:**
- `design-ops-crew-runner` — SSE subscription, tier selector, run trigger
- `design-ops-timeline` — Message timeline, agent output streaming
- `synthesis-cards/*` — Tier-specific card renderers (Quick/Balanced/In-Depth)

---

## Design Principles Guiding the Crew

**Modular & flexible** — Any combination of inputs works. Always produce output.

**Evidence-grounded** — All findings reference actual data. Assumptions labeled explicitly.

**Progressive disclosure** — Headline first (what matters), details available on demand.

**Forward momentum** — Never block on missing data. Always suggest next step.

**Three-discipline collaboration** — PM owns viability, Research owns evidence, Design owns desirability.

---

## Reference: Inputs & Stages

### Input Parameters

| Parameter | Values |
|---|---|
| `stage` | `discovery` · `validation` · `solution` · `optimization` |
| `depth` | `quick` · `balanced` · `in-depth` |

### When to Use Each Stage

- **discovery:** "We don't know if this is real"
- **validation:** "We think this is real, testing if"
- **solution:** "This is real, designing the best way"
- **optimization:** "It works, making it better"

---

## Key Patterns

### No Data Is Fine

Both Research and Designer operate without historical data by:
- Grounding in the problem frame
- Being explicit about assumptions
- Proposing specific validation steps

When no data exists, the crew still moves forward — it just labels things as "assumed" and proposes how to move them to "known."

### Concrete Over Generic

❌ "Improve the onboarding"
✅ "Remove role selector, auto-detect from email domain, cut onboarding from 5 screens to 2"

### Pain vs. Workaround Matters

What looks like a user need may be tolerance. Research must call this explicitly:
- **Workaround:** "Users skip this field" (they adapted)
- **Pain:** "Users abandon checkout at this field" (blocks progress)

### Assumptions Have Risk Levels

Not all unknowns are equal. The crew prioritizes the one assumption that, if wrong, breaks everything — and **designs toward resolving it first**.

### The Handoff Contract

- **PM's trade-offs constrain the Designer.** "We're not solving for X" means Designer can't optimize for X.
- **Research's highest-risk assumption determines what gets prototyped first.** Designer reads Research's closing line and builds to test it.
- **Each agent reads the previous agent's output, not just the original brief.** PM reads context. Research reads PM's assumptions. Designer reads Research's assumption-to-validate.

---

## Execution Flow in Code

```python
# Example: Cold brief with minimal data
run_crew(
    stage="discovery",
    problem_statement="Users struggle to find relevant products in search",
    user_segment="Mobile users, first-time visitors",
    metric="Search engagement rate"
)

# PM outputs: Problem, user, metric → 3-5 assumptions, HIGH-risk assumption
# Research outputs: Which assumptions are testable? Which still assumed? → "To validate X, test Y"
# Designer outputs: 2-3 prototype directions to test assumption → "Build interaction A, measure if B happens"
```

---

## When Agents Say No

If a gate check fails, the agent **names the gap and pauses the crew**. Examples:

- **PM:** "We don't know who this is for — is this a student, a manager, a developer? Can't frame without specificity."
- **Research:** "This assumption is so fundamental we can't move forward assuming it — we need one data point first."
- **Designer:** "The hard constraints PM gave (2 weeks, one engineer) make this unfeasible. Conflict: X. Need to revisit."

When gates fail, the team gets back an actionable gap, not a glossy output that hides the problem.
