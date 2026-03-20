from crewai import Task, Agent


def create_recommend_solution_task(agent: Agent, context: dict) -> Task:
    """
    Designer proposes 2-3 ideas to validate the highest-risk assumption.
    Receives: highest_risk_assumption (string, focused)
    Output: 2-3 concrete ideas with feasibility, trade-offs, validation steps.
    """
    problem = context.get("problem_statement", "")
    metric = context.get("metric", "")
    constraints = context.get("constraints", {})
    exploration_data = context.get("research_data", {})
    user_segment = context.get("user_segment", "")
    highest_risk_assumption = context.get("highest_risk_assumption", "")

    has_exploration = bool(exploration_data.get("prototypes_tested") or exploration_data.get("images"))

    constraint_str = ""
    if constraints:
        constraint_str = "Hard constraints: " + ", ".join(f"{k}={v}" for k, v in constraints.items())

    description = f"""You are a Product Designer. Propose 2-3 ideas to test this assumption.

**The assumption you're validating:**
{highest_risk_assumption}

**Your constraints:**
Problem: {problem}
Metric: {metric}
User segment: {user_segment}
{constraint_str}

**Check:**
1. Does this respect hard constraints? If not, name the conflict.
2. Is there prior exploration? If yes, build on consensus.
3. What user behavior must be true for each idea?

**For each of 2-3 ideas, provide:**
- specific_change: Exact UI/flow change
- why: Which research finding this addresses
- assumption_tested: What user behavior must be true
- tradeoff: What we give up
- second_order_effect: One downstream consequence
- feasibility: low / medium / high
- validation: Smallest interaction to prototype

**Then provide:**
- objective: What this design serves
- critique_anchor: Alternative approach and its trade-off

**CRITICAL:**
- YOU MUST return valid JSON ONLY
- No explanations, no markdown, no extra text
- No preamble. No closing. JSON only."""

    json_schema = """
Output ONLY valid JSON (no markdown, no preamble):
{
  "ideas": [
    {
      "specific_change": "string",
      "why": "string",
      "assumption_tested": "string",
      "tradeoff": "string",
      "second_order_effect": "string",
      "feasibility": "low | medium | high",
      "validation": "string"
    }
  ],
  "objective": "string",
  "critique_anchor": {
    "alternative": "string",
    "tradeoff": "string"
  }
}
"""

    return Task(
        description=description + f"\n\n**OUTPUT FORMAT (JSON only):**\n{json_schema}",
        expected_output=(
            "Valid JSON with 2–3 ideas array (each with specific_change, why, assumption_tested, "
            "tradeoff, second_order_effect, feasibility, validation), objective, and critique_anchor."
        ),
        agent=agent,
    )
