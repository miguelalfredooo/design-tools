# Carrier Agents — Detailed Reference

Three specialized agents run sequentially, each reading the previous agent's output and handing off to the next.

---

## Agent 1: Product Manager

**File:** `crew/agents/pm.py:create_pm()`

### Identity

| Property | Value |
|----------|-------|
| Role | Product Manager |
| Goal | Decide if this problem is worth solving now |
| Model | Claude Haiku 4.5 |
| Output | Strategic frame, assumptions, constraints |

### Persona & Philosophy

The PM is **metric-driven, direct, constraint-aware.** You decide if the foundation is solid before proceeding.

**Decision framework (from books):**
- **Lean Analytics (Ries & Croll)** — connect every finding to a KPI
- **Good Strategy / Bad Strategy (Rumelt)** — distinguish real needs from feature requests
- **Closing the Loop (Cababa)** — understand system impact, not just direct effects
- **Viability** — assess technical feasibility and resource trade-offs

**Persona rules:**
- Do not hedge. If something is unknown, say it plainly.
- Frame tightly. Resist vague problems ("improve search" → "users can't find X in Y scenario").
- Be metric-driven. One measurable outcome per brief.
- Constraint-aware. Name hard limits (time, tech, scope) upfront.

### What It Does

**Step 1: Gate Checks** (runs before any output)

The PM runs four checks before framing anything:

```
1. Is the problem specific enough to design against?
   ❌ "Improve search" (too broad)
   ✅ "Users can't find products by color" (specific)

2. Do we know who specifically suffers from this?
   ❌ "People are frustrated" (too broad)
   ✅ "New mobile users on iOS 16+" (specific segment)

3. Is there a measurable outcome?
   ❌ "Make the experience better" (feeling)
   ✅ "Increase search engagement from 30% to 50%" (metric)

4. Why does this need solving now?
   ❌ "It's a good idea" (no urgency)
   ✅ "Q2 roadmap is blocked, retention dip this cohort" (urgency)
```

**If any gate fails:** Status = "fail", return gaps array, stop crew.
**If all gates pass:** Continue to output.

**Step 2: Produce Strategic Frame**

Three lines:
- **Problem:** One sentence, specific, not broad
- **User:** Specific role/moment, not broad cohort
- **Outcome:** One measurable metric

Example:
```
Problem: Mobile users abandon checkout at address form
User: New users on iOS, first purchase
Outcome: Reduce checkout abandonment from 40% to 25%
```

**Step 3: Business Case** (max 2 sentences)

Why this, why now. Example:
```
"Q1 cohort is 60% mobile. Address entry is the top drop-off (40%).
Solving this would unlock $2M in quarterly revenue."
```

**Step 4: Assumptions** (3–5 total)

Ranked by risk. Example:
```
[
  {
    "statement": "Mobile users struggle because form is too long",
    "risk": "HIGH",
    "falsifier": "Testing a shortened form doesn't improve completion rate"
  },
  {
    "statement": "Autocomplete from address database would help",
    "risk": "MED",
    "falsifier": "Autocomplete doesn't reduce form errors"
  },
  {
    "statement": "Users have valid addresses (not typos blocking us)",
    "risk": "LOW",
    "falsifier": "Testing with real addresses shows massive typo rate"
  }
]
```

**Why ranked?** Research pressure-tests HIGH-risk assumptions first. Effort should match risk.

For each HIGH assumption: One sentence on "what would prove us wrong" (the falsifier).

**Step 5: Hard Constraints** (non-negotiables only)

Example:
```json
{
  "timeline": "Must ship by end of Q1",
  "technical": "Cannot change payment processor (contract locks us in)",
  "scope": "Address field only, not full checkout redesign"
}
```

Only include if truly hard limits. Not "nice to haves."

**Step 6: Trade-off** (one explicit decision about what we're NOT solving)

Example:
```
"We are optimizing for speed, not comprehensiveness.
International address formats will not be supported in v1."
```

**Why?** Team sees what's intentionally out of scope. Prevents scope creep.

### Output Contract

```json
{
  "status": "pass" | "fail",

  // If status = "pass":
  "strategic_frame": {
    "problem": "...",
    "user": "...",
    "outcome": "..."
  },
  "business_case": "...",
  "assumptions": [
    {
      "statement": "...",
      "risk": "HIGH" | "MED" | "LOW",
      "falsifier": "... (only if HIGH risk)"
    }
  ],
  "constraints": { "timeline": "...", "technical": "...", "scope": "..." },
  "tradeoff": "...",

  // If status = "fail":
  "gaps": [
    { "field": "user_segment", "explanation": "..." },
    { "field": "metric", "explanation": "..." }
  ]
}
```

### System Prompt (Abridged)

```python
create_pm(llm) returns Agent:
  role="Product Manager"
  goal="Decide if this problem is worth solving now. Frame tightly, name assumptions, and move forward only if the foundation is solid."

  backstory includes:
    - GATE CHECKS (4 checks before output)
    - If any fails: status = "fail", return gaps
    - If all pass: produce strategic_frame, business_case, assumptions, constraints, tradeoff
    - Rules: metric-driven, direct, constraint-aware, no hedging
    - Output: Valid JSON only, no preamble
```

### What Happens Next

Research reads the PM's assumptions and pressure-tests them against data.
Designer reads PM's hard constraints and ensures feasibility.

---

## Agent 2: Research & Insights Analyst

**File:** `crew/agents/research_insights.py:create_research_insights()`

### Identity

| Property | Value |
|----------|-------|
| Role | Research & Insights Analyst |
| Goal | Pressure-test PM's assumptions against evidence |
| Model | Claude Haiku 4.5 |
| Tools | Supabase (fetch observations, voting data) |
| Output | What we know/don't know, assumption status, highest-risk assumption |

### Persona & Philosophy

Research is **skeptical, precise, evidence-first.** You validate evidence, not ideas. You distinguish behavior from self-report and pain from workaround.

**Decision framework (from books):**
- **Interviewing Users (Portigal)** — bottom-up coding: raw data → themes → opportunities
- **Just Enough Research (Spiekermann)** — lean but rigorous
- **Closing the Loop (Cababa)** — understand full system impact
- **Lean Analytics** — connect findings to business metrics

**Persona rules:**
- Do not summarize the PM. Don't regurgitate what they said.
- Do not generate new ideas. You validate evidence.
- Do not be vague. "More research" is invalid. Be specific.
- Be explicit about uncertainty. Label confidence clearly.

### What It Does

**Step 1: Gate Checks** (runs before any output)

Three checks:

```
1. Are we looking at behavior or self-report?
   Behavior: "Users skip the role field" (observed action)
   Self-report: "Users said the role selector is confusing" (what they say)
   → Behavior is more reliable

2. Is this a real pain point or have users adapted?
   Pain: "Users abandon checkout at address" (blocks progress)
   Workaround: "Users adapted, use mobile site instead" (already solved)
   → Pain demands action, workaround means tolerance

3. Which PM assumptions does this data actually address?
   PM assumption 1: Form too long? [checked]
   PM assumption 2: Bad UX? [untouched by this data]
   → Only claim to address what data actually supports
```

**If any gate fails:** The crew can still continue, but Research signals the gap.

**Step 2: What We Know** (with confidence levels)

Each finding must include:
- **Finding:** The actual data point
- **Confidence:** Known | Probable | Assumed
- **Source:** Where it came from (SQL, survey, observation, votes)

Confidence tiers:
- **Known:** Observed in behavior, converging signals from multiple sources
- **Probable:** Consistent self-report from reliable source, one source only
- **Assumed:** No data, logical inference only

Example:
```json
{
  "what_we_know": [
    {
      "finding": "40% of checkout sessions end at address form",
      "confidence": "Known",
      "source": "SQL analysis of funnel drop-off"
    },
    {
      "finding": "Users report 'form takes too long'",
      "confidence": "Probable",
      "source": "5 user interviews, self-report only"
    },
    {
      "finding": "Mobile users likely adapted by using desktop",
      "confidence": "Assumed",
      "source": "No direct data, logical inference from behavior"
    }
  ]
}
```

**Step 3: What We Don't Know** (gaps)

Explicitly name what's missing:

```json
{
  "what_we_dont_know": [
    {
      "gap": "Why users abandon — is it form length, unclear labels, or validation errors?",
      "why_it_matters": "PM assumption depends on identifying the root cause"
    },
    {
      "gap": "Whether address autocomplete would help",
      "why_it_matters": "Designer needs to know if this is worth implementing"
    }
  ]
}
```

**Step 4: Assumption Status** (pressure-test PM's assumptions)

For each HIGH-risk assumption from PM, produce one of three verdicts:

```json
{
  "assumption_status": [
    {
      "assumption": "Mobile users struggle because form is too long",
      "status": "confirm",
      "evidence": "SQL shows 40% abandonment at address. Interviews confirm 'form fatigue.' Behavior supports."
    },
    {
      "assumption": "Autocomplete from address DB would help",
      "status": "inconclusive",
      "evidence": "Data shows form struggle but doesn't prove autocomplete solves it. Need to test."
    },
    {
      "assumption": "Users have valid addresses",
      "status": "contradict",
      "evidence": "Validation logs show 30% of entries fail address validation. Our assumption is wrong."
    }
  ]
}
```

**Verdicts:**
- **confirm:** Data strongly supports the assumption
- **contradict:** Data contradicts the assumption
- **inconclusive:** Data doesn't speak to the assumption clearly

**Step 5: Highest-Risk Assumption** (the one assumption that breaks everything)

```json
{
  "highest_risk_assumption": "Mobile users will complete checkout if form takes <2 minutes instead of current 5+"
}
```

This is the single assumption Research identifies as **most critical** to validate. If wrong, it breaks the solution.

Designer will design to test this assumption first.

**Step 6: Next Step** (one specific research action)

NOT "do more research" but a specific action:

```json
{
  "next_step": "A/B test a shortened form (3 fields instead of 8) with new mobile users. Measure completion rate and compare to baseline 60%."
}
```

### Output Contract

```json
{
  "what_we_know": [
    {
      "finding": "...",
      "confidence": "Known" | "Probable" | "Assumed",
      "source": "..."
    }
  ],
  "what_we_dont_know": [
    {
      "gap": "...",
      "why_it_matters": "..."
    }
  ],
  "assumption_status": [
    {
      "assumption": "... (from PM)",
      "status": "confirm" | "contradict" | "inconclusive",
      "evidence": "..."
    }
  ],
  "highest_risk_assumption": "...",
  "next_step": "one specific method, sample, or data source"
}
```

### System Prompt (Abridged)

```python
create_research_insights(llm, tools) returns Agent:
  role="Research & Insights Analyst"
  goal="Pressure-test PM's assumptions. Separate what we know from what we think we know."
  tools=[fetch_evidence from Supabase]

  backstory includes:
    - GATE CHECKS (3 checks: behavior vs self-report, pain vs workaround, coverage)
    - Produce: what_we_know (with confidence), what_we_dont_know, assumption_status, highest_risk_assumption, next_step
    - Rules: evidence-first, no vagueness, explicit about uncertainty
    - Output: Valid JSON only, no preamble
```

### What Happens Next

Designer reads the highest-risk assumption and designs to validate it.

---

## Agent 3: Product Designer

**File:** `crew/agents/product_design.py:create_product_design()`

### Identity

| Property | Value |
|----------|-------|
| Role | Product Designer |
| Goal | Design the fastest, most direct way to validate the highest-risk assumption |
| Model | Claude Haiku 4.5 |
| Output | 2–3 ideas, objective, critique anchor |

### Persona & Philosophy

Designer is **concrete, opinionated, constraint-aware.** You think in interactions, not ideas. Every proposal maps to specific user behavior.

**Decision framework:**
- **Desirability** — Does this solve the user's actual problem?
- **Feasibility** — Can we build this in the timeline with available resources?
- **Viability** — Does it align with business constraints?
- **Closing the Loop** — Who is affected? What cascades downstream?

**Persona rules:**
- No abstract ideas. "Improve UX" is invalid. "Remove role selector" is concrete.
- No generic UX language. Be specific: which screen, which button, which flow.
- No full redesigns unless required. Smallest change that tests the assumption.
- Every idea must be testable immediately. If you can't prototype it in a week, it's too big.

### What It Does

**Step 1: Gate Checks** (runs before any output)

Three checks:

```
1. What user behavior is this solution assuming?
   Must name it explicitly. Don't let it stay implicit.

   Example: "This solution assumes users will tap 'auto-fill' instead of typing"

2. Does this violate any hard constraints from PM?
   Check timeline, technical constraints, scope limits.

   If conflict: Name the conflict before proceeding.
   "This would require changing payment processor (constraint violation)"

3. Are we in discovery (no prior solutions) or building on direction?
   Discovery: Solutions are provocations, not proposals
   Building on existing direction: Solutions extend consensus
```

**If conflict in check 2:** Designer must name it explicitly.

**Step 2: Generate 2–3 Ideas**

Not one direction, but multiple options. Each idea is concrete and testable.

For EACH idea, include exactly these 7 fields:

```
1. Specific change: What exactly changes in the interface or flow
   Example: "Remove role selector step. Auto-detect role from email domain."

2. Why: Which research finding or assumption this addresses
   Example: "Research found form length is the blocker. Removing step cuts time 40%."

3. Assumption being tested: What user behavior must be true
   Example: "Users will accept auto-detected role without friction"

4. Trade-off: What you give up by choosing this
   Example: "Trade-off: Some users will have wrong role (2-5%). Need manual override."

5. Second-order effect: One downstream risk or consequence
   Example: "If role is wrong, user might contact support or churn. Need monitoring."

6. Feasibility: Honest engineering lift
   Example: "medium" (1-2 weeks, moderate complexity)

7. Validation: The smallest interaction to prototype first
   Example: "Prototype auto-detect + manual override. Test with 20 new users."
```

Example full idea:

```json
{
  "specific_change": "Remove role selector. Auto-detect from email domain using our domain-role mapping.",
  "why": "Research confirmed form length is the blocker. Removing a step cuts checkout time 40%.",
  "assumption_tested": "Users will accept auto-detected role. If it's wrong, they'll use the override.",
  "tradeoff": "We give up customization for speed. Some users will get wrong roles (estimated 2-5%). Requires manual override.",
  "second_order_effect": "If detection fails, users might contact support or abandon. Need to monitor support tickets and completion rates.",
  "feasibility": "medium",
  "validation": "Prototype auto-detect + override button. Test with 20 new users in research session. Success: >80% completion with <3 support mentions."
}
```

**Step 3: Objective** (what this design serves)

```json
{
  "objective": "Reduce checkout abandonment by 15% in Q1 by eliminating form friction for mobile users."
}
```

**Step 4: Critique Anchor** (for team debate)

```json
{
  "critique_anchor": {
    "alternative": "We could keep role selector, just improve its UX (clearer labels, better flow).",
    "tradeoff": "Improving selector keeps customization but doesn't solve the fundamental problem: users don't want to think about roles during checkout."
  }
}
```

This gives the team a way to debate productively. When someone pushes back:
"I think we should keep role selector" → Designer asks: "Are you willing to accept 15% lower completion rate for the customization?"

### Output Contract

```json
{
  "ideas": [
    {
      "specific_change": "...",
      "why": "...",
      "assumption_tested": "...",
      "tradeoff": "...",
      "second_order_effect": "...",
      "feasibility": "low" | "medium" | "high",
      "validation": "..."
    },
    { /* idea 2 */ },
    { /* idea 3 */ }
  ],
  "objective": "...",
  "critique_anchor": {
    "alternative": "...",
    "tradeoff": "..."
  }
}
```

**Requirement:** Minimum 2 ideas, no maximum. All ideas must be testable in ≤1 week.

### System Prompt (Abridged)

```python
create_product_design(llm) returns Agent:
  role="Product Designer"
  goal="Design the fastest, most direct way to validate the highest-risk assumption. Think in interactions, not ideas."

  backstory includes:
    - GATE CHECKS (3 checks: behavior assumption, constraint violation, discovery vs. building on direction)
    - Produce: 2–3 ideas (each with 7 fields), objective, critique_anchor
    - Rules: concrete, no abstract ideas, constraint-aware, testable immediately
    - Output: Valid JSON only, no preamble
```

### What Happens Next

Ideas are streamed to the UI. Team reads them and decides which to prototype.

---

## How Agents Interact

### Sequential Handoff

```
PM frames problem
  ↓ (assumption array)
Research pressure-tests assumptions
  ↓ (highest-risk assumption)
Designer proposes ideas to test that assumption
```

Each agent **reads the previous agent's output, not the original brief.**

### Data Flow

```
PM OUTPUT:
{
  "assumptions": [
    { "statement": "Form is too long", "risk": "HIGH" },
    { "statement": "Autocomplete helps", "risk": "MED" }
  ]
}
  ↓
RESEARCH INPUT: pm_assumptions = [...]
RESEARCH OUTPUT:
{
  "highest_risk_assumption": "Users will complete if form < 2 minutes"
}
  ↓
DESIGN INPUT: highest_risk_assumption = "..."
DESIGN OUTPUT:
{
  "ideas": [
    { "assumption_tested": "...", "validation": "..." }
  ]
}
```

---

## Modifying Agent Behavior

### Update Agent Prompt

Edit `crew/agents/<agent>.py`:

1. Find the `backstory` string
2. Update the rules, instructions, or persona
3. Test end-to-end: `python crew/crew.py`

Example: To make Designer focus on speed over polish:

```python
# Before:
backstory="Think in interactions, not ideas."

# After:
backstory="Think in interactions, not ideas. Optimize for speed and simplicity. Fastest solution wins."
```

### Update Output Schema

Edit `crew/schemas.py` to modify validation rules:

```python
def validate_design_output(data):
    # If you add a new field to ideas:
    idea_fields = [
      "specific_change", "why", "assumption_tested",
      "tradeoff", "second_order_effect", "feasibility",
      "validation",
      "new_field"  # ← Add here
    ]
    for idea in data["ideas"]:
      for field in idea_fields:
        if field not in idea:
          raise ValueError(f"Missing field: {field}")
```

Then update agent prompts to include the new field.

---

## Performance & Cost

- **Model:** Claude Haiku 4.5 (fastest, cheapest)
- **Typical crew run:** 5-15 seconds depending on synthesis tier
- **Cost:** ~$0.01 per full crew run (3 agents)
- **Temperature:** 0 (deterministic output for validation)

---

## Testing Agents

### Test Individual Agent

```python
from crew.agents import create_pm
from crew.crew import get_llm

llm = get_llm()
pm = create_pm(llm)

# Call PM's task directly
pm_task = create_frame_objective_task(pm, context)
result = pm_task.execute()
```

### Test Full Crew

```python
from crew.crew import run_crew

result = run_crew(
    stage="discovery",
    problem_statement="Users can't find products by color",
    user_segment="Mobile users, first-time buyers",
    metric="Search engagement",
)

print(result["pm_frame"])
print(result["research_synthesis"])
print(result["design_recommendation"])
```

---

## Common Issues

### Agent Output Not Changing Between Runs

LLMs are stochastic but deterministic with temp=0. If output never changes:
- Check the input changed (problem statement, data, etc.)
- Check the agent prompt wasn't overridden
- Check the schema validation passed

### Agent Violates Its Constraints

Example: Designer produces 1 idea instead of 2–3.

Fix:
1. Check schema validation catches it: `len(data["ideas"]) < 2` → error
2. If validation passed, agent prompt is unclear
3. Update backstory: "Produce exactly 3 ideas, not fewer"
4. Re-test

### Validation Error: Missing Field

Agent didn't output required field (e.g., `highest_risk_assumption`).

Fix:
1. Check agent prompt includes the field name
2. Check the backstory instructions are clear about required output
3. Test with a simpler input first
4. If still failing, update prompt to be more explicit

---

## See Also

- [CREW_HANDOFF_SPEC.md](../CREW_HANDOFF_SPEC.md) — Agent handoff contract, lifecycle stages, execution flow
- [JSON_SCHEMA_VALIDATION.md](./JSON_SCHEMA_VALIDATION.md) — Output validation & debugging
- [ITERATION_LOOP.md](./ITERATION_LOOP.md) — Multi-pass synthesis roadmap
- [../README.md](../README.md) — Project overview
- [crew/main.py](./main.py) — API server that calls agents
- [crew/crew.py](./crew.py) — Orchestration logic

