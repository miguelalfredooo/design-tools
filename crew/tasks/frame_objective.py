from crewai import Task, Agent


def create_frame_objective_task(agent: Agent, context: dict) -> Task:
    """
    PM frames the business objective, constraints, and success criteria.
    Flexible based on what inputs are provided.
    """
    problem = context.get("problem_statement", "")
    objective = context.get("objective", "")
    metric = context.get("metric", "")
    constraints = context.get("constraints", {})
    stage = context.get("stage", "discovery")

    # Build prompt based on available context
    parts = [
        "**YOU ARE PRODUCT MANAGER.** Frame this as a business bet and strategy.\n"
        "Focus ONLY on: Business case, ROI, constraints, timeline, success criteria.\n"
        "Make the strategic case for why we're solving this now and what done looks like.\n"
    ]

    if problem:
        parts.append(f"**Problem:** {problem}")
    if objective:
        parts.append(f"**Objective:** {objective}")
    if metric:
        parts.append(f"**Metric:** {metric}")
    if constraints:
        constraint_text = "\n  - ".join(f"{k}: {v}" for k, v in constraints.items())
        parts.append(f"**Constraints:**\n  - {constraint_text}")

    parts.extend([
        "\nBe direct and strategic. Show your thinking. This is the north star for the team.",
        "- Name the business case and why *now*",
        "- Distinguish what's known from what we're assuming",
        "- Surface hard constraints (timeline, technical, scope, people)",
        "- Set success criteria for this stage with a realistic timeline",
        "- Call out trade-offs explicitly. What are we *not* solving for?",
    ])

    return Task(
        description="\n".join(parts),
        expected_output=(
            "Strategic frame that's clear enough to brief the team. "
            "Include: the problem, why we're solving it now, what success looks like (with timeline), "
            "constraints that matter, what we're assuming, and what we're explicitly not solving. "
            "Use natural language — write like you're convincing someone in a meeting, not filling a form."
        ),
        agent=agent,
    )
