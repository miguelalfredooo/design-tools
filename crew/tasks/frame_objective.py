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
    parts = ["You are the Product Manager. Your job is to frame what we're solving and why."]

    if problem:
        parts.append(f"\nPROBLEM: {problem}")
    if objective:
        parts.append(f"OBJECTIVE: {objective}")
    if metric:
        parts.append(f"METRIC: {metric}")
    if constraints:
        constraint_text = "\n".join(f"  - {k}: {v}" for k, v in constraints.items())
        parts.append(f"CONSTRAINTS:\n{constraint_text}")

    parts.extend([
        "\nYour job:",
        f"1. Articulate the business case (why are we solving this? what metric matters?)",
        f"2. Name what's known vs. assumed",
        f"3. Surface constraints that will affect the solution",
        f"4. Set clear success criteria for this stage ({stage})",
        f"\nYour output should be concise and actionable. Name trade-offs directly.",
    ])

    return Task(
        description="\n".join(parts),
        expected_output=(
            "OBJECTIVE FRAME that includes:\n"
            "- PROBLEM: one-line problem statement\n"
            "- OBJECTIVE: what success looks like\n"
            "- METRIC: what we're measuring\n"
            "- CONSTRAINTS: timeline, technical, scope\n"
            "- SUCCESS CRITERIA: how we know this worked\n"
            "- ASSUMPTIONS: what we're taking as given"
        ),
        agent=agent,
    )
