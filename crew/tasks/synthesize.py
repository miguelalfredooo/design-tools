from crewai import Task, Agent


def create_synthesize_task(agent: Agent, context: dict) -> Task:
    """
    Research pressure-tests PM's ranked assumptions.
    Output is a handoff to Designer, not a synthesis document.
    """
    problem = context.get("problem_statement", "")
    metric = context.get("metric", "")
    stage = context.get("stage", "discovery")
    depth = context.get("synthesis_tier", "balanced")
    research_data = context.get("research_data", {})
    pm_assumptions = context.get("pm_assumptions", [])
    user_segment = context.get("user_segment", "")

    # Gate check
    parts = [
        "**GATE CHECK — answer these before synthesizing:**\n"
        "1. Are we looking at behavior or self-report?\n"
        "2. Is this a pain point (blocks progress) or a workaround (users adapted)?\n"
        "3. Which PM assumptions does data speak to? Which are still untouched?\n\n"
    ]

    if problem:
        parts.append(f"**Problem:** {problem}")
    if metric:
        parts.append(f"**Metric:** {metric}")
    if user_segment:
        parts.append(f"**User segment:** {user_segment}")

    # PM assumptions to pressure-test
    if pm_assumptions:
        parts.append("\n**PM's ranked assumptions to pressure-test:**")
        for i, assumption in enumerate(pm_assumptions, 1):
            parts.append(f"{i}. {assumption}")

    # Data available
    data_available = []
    if research_data.get("snowflake_results"):
        data_available.append("Quantitative data (SQL)")
    if research_data.get("survey_responses"):
        data_available.append("Survey responses")
    if research_data.get("prototypes_tested"):
        data_available.append("Prototype test results")
    if research_data.get("qualitative"):
        data_available.append("Interview notes")

    if data_available:
        parts.append(f"\n**Data available:** {', '.join(data_available)}")
    else:
        parts.append("\n**Data available:** None — use discovery mode")

    # Scenario-based guidance
    parts.extend([
        "\n**SCENARIO A — with data:**\n"
        "For each HIGH-risk PM assumption:\n"
        "- Confirm / Contradict / Inconclusive\n"
        "- Distinguish: what data shows vs. inference\n"
        "- Confidence: Known (behavior, multiple sources) / Probable (self-report) / Assumed (no data)\n"
        "- Pain vs. workaround? If workaround, is pain acute enough to motivate change?\n"
        "- Name one finding team will want to dismiss — why they shouldn't\n\n"
        "**SCENARIO B — without data:**\n"
        "- Restate top 2 HIGH-risk assumptions as testable hypotheses\n"
        "- Propose ONE specific research action per hypothesis\n"
        "  (not 'do more research' — e.g., '5 contextual interviews with X role, focused on Y moment')\n"
        "- Flag: solutions should be provocations when in discovery mode\n\n"
        "**ALWAYS close with:**\n"
        "> To move [highest-risk assumption] from assumed → known, we need: [specific thing]\n"
        "Designer will prototype against this assumption."
    ])

    # Depth guidance
    if depth == "quick":
        parts.append(
            "\n**DEPTH: QUICK**\nSurface 2–3 key findings. Skip nuance. Headline only."
        )
    elif depth == "in-depth":
        parts.append(
            "\n**DEPTH: IN-DEPTH**\nExplore competing interpretations. Show reasoning. "
            "What would prove each finding wrong?"
        )

    expected_output = (
        "Handoff to Designer:\n\n"
        "1. Pressure-test result (Confirm/Contradict/Inconclusive per assumption)\n"
        "2. Confidence ratings (Known/Probable/Assumed)\n"
        "3. One finding to defend against dismissal\n"
        "4. Pain vs. workaround call\n"
        "5. Closing line: 'To move [assumption] from assumed → known, we need [specific thing]'\n\n"
        "No document. Handoff only."
    )

    return Task(
        description="\n".join(parts),
        expected_output=expected_output,
        agent=agent,
    )
