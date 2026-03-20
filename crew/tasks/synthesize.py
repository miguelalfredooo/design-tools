from crewai import Task, Agent


def create_synthesize_task(agent: Agent, context: dict) -> Task:
    """
    Research & Insights synthesizes all available evidence.
    Flexible based on what data and context is provided.
    Tier affects output depth: quick (snappy), balanced (standard), in-depth (thorough).
    """
    problem = context.get("problem_statement", "")
    hypothesis = context.get("hypothesis", "")
    metric = context.get("metric", "")
    stage = context.get("stage", "discovery")
    synthesis_tier = context.get("synthesis_tier", "balanced")
    research_data = context.get("research_data", {})

    # Build prompt based on available context
    parts = [
        "**YOU ARE RESEARCH & INSIGHTS.** Your job is NOT to repeat the PM's strategy frame.\n"
        "Focus ONLY on: What does the evidence show? What are we confident about? What's missing?\n"
        "Synthesize the data. Surface what we know vs. what we're assuming. Be specific about confidence levels.\n"
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
        parts.append(
            f"\nNOTE: No research data in database yet. That's fine — work with the strategy frame provided. "
            f"Ground your synthesis in the problem statement, hypothesis, and user segment. "
            f"Propose concrete next steps to validate your thinking."
        )

    # Synthesis tier guidance
    if synthesis_tier == "quick":
        parts.extend([
            "\nSYNTHESIS TIER: QUICK",
            "Be snappy and directional. Surface 2-3 key patterns only.",
            "Skip nuance and competing interpretations. Just the headline findings.",
        ])
    elif synthesis_tier == "in-depth":
        parts.extend([
            "\nSYNTHESIS TIER: IN-DEPTH",
            "Go deep. Explore competing interpretations, contradictions, and underlying tensions.",
            "Show your reasoning. Why might the data point to multiple conclusions?",
        ])

    parts.extend([
        "\nYour job:",
        "1. Synthesize what's available (or what we can infer from the problem/objective)",
        "2. Be specific about: what we know, what we're assuming, confidence levels",
        "3. Distinguish pain points from workarounds users adapted to",
        "4. **Always end with concrete next steps** — what to test, research, or build",
        "   - If data is thin, propose what to gather (surveys, interviews, analytics, prototypes)",
        "   - Make it specific: 'Talk to 5 new user segments in X role' not 'do more research'\n",
        "Rules:",
        "- No false conclusions, but directional thinking is better than waiting",
        "- Flag assumptions explicitly. Confidence levels matter.",
        "- Missing database data ≠ missing opportunities. Use the problem frame to move forward",
        "- End every synthesis with a *specific* validation roadmap",
    ])

    # Tier-specific expected output
    if synthesis_tier == "quick":
        expected_output = (
            "Snappy findings that fit a Slack message. One headline. 2-3 key insights with confidence levels. "
            "One next step. Don't over-explain — we want the signal, not the noise."
        )
    elif synthesis_tier == "in-depth":
        expected_output = (
            "Deep synthesis that explores competing interpretations. Show your reasoning. "
            "For each finding: what the data shows, why it matters, confidence level, what we're assuming, "
            "and what would prove it wrong. Include what data we're still missing. "
            "Write for thoughtful people who want to understand, not just be told."
        )
    else:  # balanced (default)
        expected_output = (
            "Clear, actionable synthesis written for the PM and design team. "
            "Lead with the headline finding. Then walk through: what the data shows, why it matters, "
            "confidence level, key assumptions, and what to do next. "
            "Use plain language. Bold the key insights. Skip bureaucratic sections."
        )

    return Task(
        description="\n".join(parts),
        expected_output=expected_output,
        agent=agent,
    )
