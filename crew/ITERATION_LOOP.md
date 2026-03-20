# Iteration Loop — Refining Synthesis Through Multiple Passes

**Status:** Infrastructure ready, UI not yet implemented
**Location:** `crew/crew.py:26-38` (params), `crew.py:37, 62` (usage)

---

## The Problem: First Pass Isn't Always Enough

When running the crew once, the Designer receives Research's highest-risk assumption and proposes ideas. But what if:

- **Confidence is low** — assumptions feel shaky, ideas feel speculative
- **Contradiction detected** — Research found conflicting evidence
- **Designer needs iteration** — first ideas don't feel tight or differentiated enough

Currently: Crew stops after one pass.
Desired: Let agents refine if confidence is low.

---

## How Iteration Works (Planned)

### Single Pass (Current)

```
User Input
    ↓
PM → Frames problem, surfaces assumptions
    ↓
Research → Pressure-tests assumptions, finds highest-risk
    ↓
Designer → Proposes ideas to test that assumption
    ↓
Output
```

### Iterative Passes (Planned)

```
User Input (+ optional previous Design output)
    ↓
PM → Frames problem, surfaces assumptions [PASS 1]
    ↓
Research → Pressure-tests assumptions, finds highest-risk [PASS 1]
    ↓
Designer → Proposes ideas [PASS 1]
    ↓
[IF: low confidence OR contradictions]
    ↓
Research → Refines assumptions based on Design output [PASS 2]
    ↓
Designer → Refines ideas based on updated assumptions [PASS 2]
    ↓
Output (all passes included)
```

---

## Infrastructure (Already Implemented)

### 1. **Iteration Parameter**

`crew/crew.py:26-38`:
```python
def run_crew(
    stage: str = "discovery",
    synthesis_tier: str = "balanced",
    problem_statement: Optional[str] = None,
    # ... other params ...
    previous_design_output: Optional[dict] = None,
    iteration: int = 1,  # ← Iteration counter
) -> dict:
```

**What it does:**
- `iteration: 1` = first pass (default)
- `iteration: 2` = second pass (refining)
- `iteration: 3+` = further refinement

### 2. **Context Passing**

`crew/crew.py:51-63`:
```python
base_context = {
    "stage": stage,
    "synthesis_tier": synthesis_tier,
    "problem_statement": problem_statement,
    # ...
    "previous_design_output": previous_design_output or {},
    "iteration": iteration,
}
```

**What it does:**
- Pass iteration count to agents
- Pass previous Design output for reference
- Agents can adjust tone/detail based on iteration number

### 3. **Agent Awareness**

Agents in `crew/agents/*.py` have access to iteration context:

```python
# Inside agent.py
# The task context includes:
# - iteration: 1, 2, 3...
# - previous_design_output: {...} (optional)
# - Agents can tailor response based on "this is iteration 2, refine the best idea"
```

---

## What's Missing (To Enable Full Iteration)

### 1. **Iteration Decision Logic**

Currently: No decision about whether to iterate
Needed: Logic to detect when iteration would help

```python
# crew/crew.py (PLANNED)
def should_iterate(
    pm_output: dict,
    research_output: dict,
    design_output: dict,
    max_iterations: int = 3,
    current_iteration: int = 1
) -> bool:
    """Decide if another iteration would be valuable."""

    # Stop if we've hit max iterations
    if current_iteration >= max_iterations:
        return False

    # LOW confidence → iterate to tighten assumptions
    confidence_scores = [
        1.0 if item["confidence"] == "Known" else
        0.5 if item["confidence"] == "Probable" else
        0.0
        for item in research_output.get("what_we_know", [])
    ]
    avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0

    if avg_confidence < 0.5:
        return True  # ← Iterate to increase confidence

    # Contradictions detected → iterate to resolve
    contradictions = [
        item for item in research_output.get("assumption_status", [])
        if item["status"] == "contradict"
    ]
    if contradictions:
        return True  # ← Iterate to address contradictions

    return False
```

### 2. **Iteration Loop in Crew Kickoff**

Currently: Sequential PM → Research → Designer (one pass)
Needed: Loop that can repeat Research & Designer

```python
# crew/crew.py (PLANNED)
def run_crew_with_iteration(...) -> dict:
    """Run crew with optional iteration for refinement."""

    current_iteration = 1
    pm_output = None
    research_output = None
    design_output = None
    all_iterations = []

    # STEP 1: PM frames problem (only runs once)
    pm_output = run_pm_agent(...)
    if pm_output["status"] == "fail":
        return { "pm_frame": pm_output, ... }

    # STEPS 2-3: Research & Design can iterate
    iteration_limit = 3
    while current_iteration <= iteration_limit:
        # Run Research
        research_output = run_research_agent(
            pm_assumptions=pm_output["assumptions"],
            previous_design_output=design_output if current_iteration > 1 else None,
            iteration=current_iteration,
        )

        if research_output.get("status") == "fail":
            break

        # Run Designer
        design_output = run_design_agent(
            highest_risk_assumption=research_output["highest_risk_assumption"],
            iteration=current_iteration,
        )

        # Record this iteration's outputs
        all_iterations.append({
            "iteration": current_iteration,
            "research": research_output,
            "design": design_output,
        })

        # Decide: should we iterate again?
        if not should_iterate(pm_output, research_output, design_output, iteration_limit, current_iteration):
            break

        current_iteration += 1

    return {
        "pm_frame": pm_output,
        "iterations": all_iterations,  # All passes
        "final_research": research_output,  # Latest pass
        "final_design": design_output,  # Latest pass
    }
```

### 3. **Agent Prompt Updates**

**For Research Agent** (iteration 2+):
```
This is iteration 2 of synthesis. The Designer has proposed ideas in iteration 1.
Your job: Review those ideas and refine your assumptions.
- Did the Designer's ideas reveal gaps in your analysis?
- Should you update confidence levels based on the ideas?
- Which assumption is MOST critical for Designer to test next?
```

**For Designer Agent** (iteration 2+):
```
This is iteration 2 of synthesis. Your first ideas in iteration 1 were: [...]
Your job: Refine and differentiate.
- Build on your strongest idea from iteration 1
- Address any assumption gaps Research flagged
- Propose 1-2 variants that test different aspects of the same assumption
```

### 4. **UI Component Updates**

Currently: Design ops shows a single timeline
Needed: Show iteration tabs or accordion

```typescript
// components/design/design-ops-timeline.tsx (PLANNED)

export function DesignOpsTimeline({ iterations }) {
  return (
    <div>
      <Tabs defaultValue="iteration-1">
        {iterations.map((iteration, i) => (
          <TabsContent key={i} value={`iteration-${iteration.number}`}>
            <div>
              <h3>Iteration {iteration.number}</h3>
              <SynthesisCard tier={tier} agent="research" output={iteration.research} />
              <SynthesisCard tier={tier} agent="design" output={iteration.design} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
```

---

## Current State: Why Iteration Isn't Exposed Yet

### Infrastructure ✅ Ready
- `iteration` parameter exists
- `previous_design_output` context available
- Agents can access iteration count

### Logic ⚠️ Partially Done
- Decision algorithm (should_iterate) needs implementation
- Iteration loop in crew.py needs wiring
- Agent prompts need iteration-aware instructions

### UI ❌ Not Implemented
- No iteration tabs in design-ops timeline
- Can't select "iterate after first pass"
- Can't view comparison between iterations

---

## Example: How Iteration Would Help

### Scenario: Low Confidence Research

**Iteration 1 - PM:**
```json
{
  "status": "pass",
  "assumptions": [
    { "statement": "New users are blocked by role selection", "risk": "HIGH", ... }
  ]
}
```

**Iteration 1 - Research:**
```json
{
  "what_we_know": [
    { "finding": "3 users mentioned role confusion", "confidence": "Probable" },
    { "finding": "But 7 users didn't mention it", "confidence": "Assumed" }
  ],
  "highest_risk_assumption": "role selection is the main blocker"
}
```

**Iteration 1 - Designer:**
```json
{
  "ideas": [
    { "specific_change": "Remove role selector", "assumption_tested": "..." }
  ]
}
```

**System detects:** Low confidence (avg 0.5), triggers iteration

**Iteration 2 - Research:**
```json
{
  "what_we_know": [
    { "finding": "Designer proposes removing role selector entirely", "confidence": "Known" },
    { "finding": "This would require inferring role from email domain", "confidence": "Known" },
    { "finding": "7 non-mentioning users likely adapted to role selection", "confidence": "Probable" }
  ],
  "highest_risk_assumption": "email domain gives us the right role 95%+ of the time"
}
```

**Iteration 2 - Designer:**
```json
{
  "ideas": [
    { "specific_change": "Remove selector, infer from email + manual override option", ... },
    { "specific_change": "Keep selector but auto-detect + pre-fill", ... }
  ]
}
```

**Result:** More differentiated ideas, higher confidence, better grounded

---

## Enabling Iteration: Implementation Steps

### Phase 1: Add Iteration Detection (1-2 hours)
- [ ] Implement `should_iterate()` function
- [ ] Add tests for iteration decision logic
- [ ] Wire into crew.py after Design output

### Phase 2: Update Agent Prompts (1-2 hours)
- [ ] Add iteration-aware instructions to Research agent
- [ ] Add iteration-aware instructions to Designer agent
- [ ] Test that agents follow iteration instructions

### Phase 3: Update Crew Kickoff (2-3 hours)
- [ ] Refactor crew.py to loop Research & Designer
- [ ] Collect outputs from all iterations
- [ ] Return structure: `{"iterations": [...], "final_research": ..., "final_design": ...}`

### Phase 4: Update API Endpoint (1 hour)
- [ ] Return all iterations in SSE stream
- [ ] Signal iteration boundaries to UI
- [ ] Include iteration metadata

### Phase 5: Update UI (2-3 hours)
- [ ] Add iteration tabs to timeline
- [ ] Show "Iteration 1" vs "Iteration 2" labels
- [ ] Compare ideas across iterations
- [ ] Display when system triggered iteration

### Phase 6: Testing & Refinement (2-3 hours)
- [ ] Test full crew with iteration loop
- [ ] Verify confidence scores trigger iteration
- [ ] Test max iteration limit (prevent infinite loops)
- [ ] Hallway test iteration UI clarity

---

## Current Workarounds (Before Full Iteration)

**Want to refine ideas?** Run crew twice manually:

```bash
# Run 1: Get initial ideas
POST /design-ops/run {
  "stage": "discovery",
  "problem_statement": "...",
  ...
}

# Review ideas, then run 2: Pass previous output
POST /design-ops/run {
  "stage": "discovery",
  "problem_statement": "...",
  "previous_design_output": {  # ← From run 1
    "ideas": [...],
    "objective": "...",
    ...
  }
}
```

Agents will see `previous_design_output` in context and adjust. Not automated, but technically possible now.

---

## Future Possibilities

Once iteration is working:

1. **User-triggered iteration** — "Refine these ideas" button
2. **Confidence-based auto-iteration** — Automatically iterate if avg confidence < 50%
3. **Contradiction resolution** — Iterate to resolve HIGH-contradiction assumptions
4. **Streaming iteration** — Show each iteration pass live in UI
5. **Multi-perspective iteration** — Different teams iterate on same brief
6. **Cost tracking** — Show # API calls + cost per iteration

---

## Key Decision Points

**Question 1: When should iteration auto-trigger?**
- Option A: User clicks "Iterate" button (manual)
- Option B: System auto-iterates if confidence < threshold
- Recommendation: Start with manual (user control), add auto later

**Question 2: Max iterations?**
- Option A: User can choose (1, 2, 3 iterations)
- Option B: System decides (default 2, max 3)
- Recommendation: Start with fixed max=3, expose as setting later

**Question 3: Show all iterations or just final?**
- Option A: Show all (tabs or accordion)
- Option B: Show only final, log others
- Recommendation: Show all (transparency, see the reasoning)

**Question 4: Should iteration affect cost/timing?**
- Option A: Extra iterations cost extra (pay per run)
- Option B: Iterations included in synthesis cost
- Recommendation: Pay-per-pass (transparent)

---

## Metrics to Track (Once Implemented)

- % of runs that trigger iteration
- Avg confidence increase per iteration
- Ideas generated per iteration (diversity)
- Time spent on iteration
- User satisfaction: single-pass vs. iterated outputs

---

## References

- **crew/crew.py** — Current single-pass implementation (refactor target)
- **crew/agents/*.py** — Agent definitions (need iteration-aware prompts)
- **crew/schemas.py** — Output validation (no changes needed)
- **CREW_HANDOFF_SPEC.md** — Agent contract (update with iteration behavior)

