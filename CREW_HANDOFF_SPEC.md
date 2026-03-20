# Carrier Design Agents: Handoff-Driven Spec

> Each agent answers the previous agent's unresolved question.
> **PM surfaces risk → Research pressure-tests it → Designer validates the highest-risk assumption first.**

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
