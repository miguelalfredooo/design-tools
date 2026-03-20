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

    if context.get("synthesis_tier") == "test":
        description = f"""PM test mode. Absolute minimum.

Problem: {problem}
Metric: {metric}

Output TWO things only:
1. Frame (one sentence)
2. Top assumption (one sentence)

No essay."""
    else:
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

If any gate fails:
- Set "status": "fail"
- Fill "gaps" with missing elements
- Leave other fields empty

If all gates pass: produce JSON with status "pass":
- strategic_frame (problem, user, outcome)
- business_case (why this, why now)
- assumptions (3–5 with risk level and falsifiers for HIGH)
- constraints (non-negotiables only)
- tradeoff (what we're NOT solving)

**CRITICAL:**
- YOU MUST return valid JSON ONLY
- No explanations, no markdown, no extra text
- No preamble. No closing. JSON only."""

    json_schema = """
Output ONLY valid JSON (no markdown, no preamble):
{
  "status": "pass | fail",
  "gaps": ["string"],
  "strategic_frame": {
    "problem": "string",
    "user": "string",
    "outcome": "string"
  },
  "business_case": "string",
  "assumptions": [
    {
      "statement": "string",
      "risk": "HIGH | MED | LOW",
      "falsifier": "string (only if HIGH)"
    }
  ],
  "constraints": ["string"],
  "tradeoff": "string"
}
"""

    return Task(
        description=description + f"\n\n**OUTPUT FORMAT (JSON only):**\n{json_schema}",
        expected_output=(
            "Valid JSON with status, gaps (if any), strategic_frame, business_case, "
            "assumptions array with risk levels and falsifiers, constraints, and tradeoff."
        ),
        agent=agent,
    )
