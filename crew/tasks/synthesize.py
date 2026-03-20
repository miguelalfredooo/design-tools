from crewai import Task, Agent


def create_synthesize_task(agent: Agent, context: dict) -> Task:
    """
    Research pressure-tests PM's assumptions against data.
    Output: what we know, what we don't, what to test next.
    """
    problem = context.get("problem_statement", "")
    metric = context.get("metric", "")
    research_data = context.get("research_data", {})
    user_segment = context.get("user_segment", "")

    # Check what data we have
    has_data = bool(research_data.get("snowflake_results") or
                    research_data.get("survey_responses") or
                    research_data.get("prototypes_tested") or
                    research_data.get("qualitative"))

    data_summary = ""
    if has_data:
        data_parts = []
        if research_data.get("snowflake_results"):
            data_parts.append("Quantitative")
        if research_data.get("survey_responses"):
            data_parts.append("Survey")
        if research_data.get("prototypes_tested"):
            data_parts.append("Prototype tests")
        if research_data.get("qualitative"):
            data_parts.append("Interviews")
        data_summary = f"Data we have: {', '.join(data_parts)}"
    else:
        data_summary = "No data yet. Use discovery mode."

    pm_output = context.get("pm_output", "")

    description = f"""You are Research & Insights. Pressure-test the PM's assumptions.

**PM's frame:**
{pm_output}

**Your data:**
Problem: {problem}
Metric: {metric}
User segment: {user_segment}
{data_summary}

**Your job:**
1. Read PM's ranked assumptions above. For each HIGH-risk assumption:
   - Confirm / Contradict / Inconclusive (based on what data you have)
   - Rate confidence: Known (behavior, multiple sources) / Probable (self-report) / Assumed (no data)
2. Is this a pain point (blocks users) or a workaround (they adapted)?
3. Name one finding we'd want to dismiss, and why we shouldn't.
4. **Close with:** "To prove [the highest-risk assumption] wrong, we'd need [specific thing]"

If no data: restate top 2 assumptions as hypotheses. Propose one specific research action (not "do more research").

Write direct. No essay."""

    return Task(
        description=description,
        expected_output=(
            "Pain point or workaround? / For each HIGH assumption: Confirm/Contradict/Inconclusive + confidence / "
            "One finding to defend / Closing: 'To prove X wrong, we'd need Y.'"
        ),
        agent=agent,
    )
