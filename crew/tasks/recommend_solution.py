from crewai import Task, Agent


def create_recommend_solution_task(agent: Agent, context: dict) -> Task:
    """
    Designer proposes the most direct path to validating the highest-risk assumption Research handed over.
    Output is a handoff, not a design document.
    """
    problem = context.get("problem_statement", "")
    metric = context.get("metric", "")
    constraints = context.get("constraints", {})
    stage = context.get("stage", "solution")
    depth = context.get("synthesis_tier", "balanced")
    research_assumptions = context.get("research_assumptions", [])
    highest_risk_assumption = context.get("highest_risk_assumption", "")
    exploration_data = context.get("research_data", {})
    user_segment = context.get("user_segment", "")

    # Gate check
    parts = [
        "**GATE CHECK — answer these before proposing:**\n"
        "1. What user behavior is this solution assuming? (Name it explicitly — don't let it stay implicit)\n"
        "2. Does this respect PM's hard constraints? (If not, name the conflict)\n"
        "3. Is there prior exploration to build on?\n"
        "   - If yes → extend consensus, explain deviations\n"
        "   - If no → discovery mode, solutions are provocations not proposals\n\n"
    ]

    if problem:
        parts.append(f"**Problem:** {problem}")
    if metric:
        parts.append(f"**Metric:** {metric}")
    if user_segment:
        parts.append(f"**User segment:** {user_segment}")

    if constraints:
        constraint_text = "\n  - ".join(f"{k}: {v}" for k, v in constraints.items())
        parts.append(f"\n**Hard constraints (PM's non-negotiables):**\n  - {constraint_text}")

    if highest_risk_assumption:
        parts.append(f"\n**Highest-risk assumption to validate:**\n{highest_risk_assumption}")

    # Exploration data check
    has_exploration = exploration_data.get("prototypes_tested") or exploration_data.get("images")

    # Scenario-based guidance
    if has_exploration:
        parts.extend([
            "\n**SCENARIO A — with exploration data:**\n"
            "Build on existing consensus:\n"
            "- Reference what was tested and what signal it produced\n"
            "- Extend the direction that earned most confidence\n"
            "- If deviating from consensus: name why explicitly\n"
        ])
    else:
        parts.extend([
            "\n**SCENARIO B — discovery mode (no exploration data):**\n"
            "Solutions are provocations — concrete enough to react to, not precious enough to defend:\n"
            "- Name the specific interaction being tested\n"
            "- State the user behavior assumption being tested\n"
            "- Propose the smallest thing to build that tests the assumption\n"
        ])

    parts.extend([
        "\n**For each idea, answer:**\n"
        "1. **Specific change** — what exactly in the interface or flow\n"
        "2. **Why** — which user behavior or finding this responds to\n"
        "3. **Trade-off** — what you lose by choosing this\n"
        "4. **Second-order effect** — one downstream consequence to monitor\n"
        "5. **Feasibility** — engineering lift estimate\n"
        "6. **Validation** — what specific interaction to prototype first\n\n"
        "**Propose 2-3 ideas** (not vague 'improvements')\n\n"
        "**Close with critique anchor:**\n"
        "> The objective this design serves is [___].\n"
        "> If someone pushes back, the trade-off to surface is:\n"
        "> choosing [alternative] means giving up [specific thing] for the user."
    ])

    # Depth guidance
    if depth == "quick":
        parts.append(
            "\n**DEPTH: QUICK**\n"
            "One direction + the trade-off + the next prototype to build."
        )
    elif depth == "in-depth":
        parts.append(
            "\n**DEPTH: IN-DEPTH**\n"
            "Full exploration: alternatives considered, feasibility, assumption map, "
            "prototype roadmap, validation plan, risks."
        )

    expected_output = (
        "Handoff output:\n\n"
        "2–3 ideas with:\n"
        "- Specific change (not generic)\n"
        "- User behavior being tested\n"
        "- Trade-off explicitly named\n"
        "- Second-order effect to monitor\n"
        "- Feasibility estimate\n"
        "- Prototype priority\n\n"
        "Close with critique anchor:\n"
        "> The objective this design serves is [___].\n"
        "> Choosing [alternative] means giving up [specific thing].\n\n"
        "No design document. Handoff only."
    )

    return Task(
        description="\n".join(parts),
        expected_output=expected_output,
        agent=agent,
    )
