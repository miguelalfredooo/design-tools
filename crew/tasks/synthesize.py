from crewai import Task, Agent


def create_synthesize_task(agent: Agent, context: dict) -> Task:
    """
    Research & Insights synthesizes all available evidence.
    Flexible based on what data and context is provided.
    """
    problem = context.get("problem_statement", "")
    hypothesis = context.get("hypothesis", "")
    metric = context.get("metric", "")
    stage = context.get("stage", "discovery")
    research_data = context.get("research_data", {})

    # Build prompt based on available context
    parts = [
        "You are the Research & Insights Analyst. Your job is to synthesize evidence and surface patterns.\n"
    ]

    if problem:
        parts.append(f"PROBLEM: {problem}")
    if hypothesis:
        parts.append(f"HYPOTHESIS TO TEST: {hypothesis}")
    if metric:
        parts.append(f"METRIC WE'RE MEASURING: {metric}")

    # Describe available data
    data_available = []
    if research_data.get("snowflake_results"):
        data_available.append("Quantitative data (SQL queries)")
    if research_data.get("survey_responses"):
        data_available.append("Survey feedback")
    if research_data.get("prototypes_tested"):
        data_available.append("Prototype test results and stakeholder votes")
    if research_data.get("images"):
        data_available.append("Design images/mockups")
    if research_data.get("supabase_observations"):
        data_available.append("Research observations")

    if data_available:
        parts.append(f"\nDATA AVAILABLE: {', '.join(data_available)}")
    else:
        parts.append(f"\nNOTE: Limited data available. Proceed with directional insights + stated assumptions.")

    parts.extend([
        "\nYour job:",
        "1. Synthesize all available evidence using your two-pass method:",
        "   - What does the data show? (direct findings)",
        "   - What might it mean? (inferences + assumptions)",
        "2. Label every finding with confidence: High / Medium / Low",
        "3. Flag assumptions explicitly. Lead with assumptions for low-confidence findings.",
        "4. Distinguish pain points from satisficing (users adapted to broken systems)",
        "5. Always end with actionable next steps\n",
        "Rules:",
        "- Ground everything in what the data actually says",
        "- Flag inferences vs. direct findings",
        "- Directional insight with stated assumptions > silence",
        "- Never fabricate evidence. If data is thin, say so.",
    ])

    return Task(
        description="\n".join(parts),
        expected_output=(
            "STRUCTURED SYNTHESIS that includes:\n"
            "- SUBJECT: one-line finding or pattern\n"
            "- CONFIDENCE: High / Medium / Low (with explanation)\n"
            "- ASSUMPTIONS: what's taken as given\n"
            "- FINDINGS: 2-5 patterns, each with:\n"
            "    - Description\n"
            "    - Evidence (data sources)\n"
            "    - Confidence\n"
            "- NEXT STEPS: how to validate or act on this\n"
            "- MISSING CONTEXT: what data would make this stronger"
        ),
        agent=agent,
    )
