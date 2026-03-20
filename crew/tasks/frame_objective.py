from crewai import Task, Agent


def create_frame_objective_task(agent: Agent, context: dict) -> Task:
    """
    PM frames the problem and surfaces ranked assumptions.
    Output is 5 things: frame, case, assumptions, constraints, trade-off.
    """
    problem = context.get("problem_statement", "")
    metric = context.get("metric", "")
    constraints = context.get("constraints", {})
    user_segment = context.get("user_segment", "")

    description = f"""You are a Product Manager. Your job: frame this problem and surface what we don't know.

**Input:**
Problem: {problem}
Metric: {metric}
User segment: {user_segment}
Constraints: {constraints if constraints else "None"}

**Check these gates:**
1. Is the problem specific enough to design against?
2. Do we know who suffers from this, or are we assuming?
3. Is there a measurable outcome?
4. Why now vs. next quarter?

If any gate fails: name the gap. Stop. Do not proceed.

If all gates pass: produce exactly 5 things:

1. **Frame** (one sentence each):
   - Problem
   - User
   - Metric/outcome

2. **Why this, why now** (one sentence)

3. **Ranked assumptions** (3–5, each tagged HIGH/MED/LOW):
   For each HIGH: "Prove us wrong if [X]"

4. **Hard constraints** (non-negotiable: time, tech, scope)

5. **What we're NOT solving** (one trade-off)

Write directly. No essay. No preamble. Just the 5 things."""

    return Task(
        description=description,
        expected_output=(
            "Frame. Business case. Ranked assumptions (HIGH/MED/LOW risk). "
            "For each HIGH: one sentence on how we'd be wrong. "
            "Hard constraints. One trade-off we're not solving for."
        ),
        agent=agent,
    )
