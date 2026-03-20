from crewai import Task, Agent


def create_synthesize_task(agent: Agent, context: dict) -> Task:
    """
    Research pressure-tests PM's assumptions against data.
    Receives: pm_assumptions array (structured)
    Output: what we know, what we don't, highest-risk assumption, next step.
    """
    problem = context.get("problem_statement", "")
    metric = context.get("metric", "")
    research_data = context.get("research_data", {})
    user_segment = context.get("user_segment", "")
    pm_assumptions = context.get("pm_assumptions", [])

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

    # Format PM assumptions for display
    assumptions_str = ""
    if pm_assumptions:
        assumptions_str = "**PM's assumptions to pressure-test:**\n"
        for i, assumption in enumerate(pm_assumptions, 1):
            statement = assumption.get("statement", "")
            risk = assumption.get("risk", "")
            assumptions_str += f"{i}. [{risk}] {statement}\n"
    else:
        assumptions_str = "**PM's assumptions:** None provided"

    description = f"""You are Research & Insights. Pressure-test these specific assumptions.

{assumptions_str}

**Your constraints:**
Problem: {problem}
Metric: {metric}
User segment: {user_segment}
{data_summary}

**Your job:**
1. For each HIGH-risk PM assumption: Confirm / Contradict / Inconclusive
2. Rate confidence on findings: Known (behavior, multiple sources) / Probable (self-report) / Assumed (no data)
3. Identify what we don't know (gaps tied to PM assumptions)
4. Name the single highest-risk assumption that, if wrong, breaks the solution
5. Specify next step: one concrete method, sample, or data source needed

If no data: be explicit about what's assumed. Propose one specific research action (not "do more research").

**CRITICAL:**
- YOU MUST return valid JSON ONLY
- No explanations, no markdown, no extra text
- No preamble. No closing. JSON only."""

    json_schema = """
Output ONLY valid JSON (no markdown, no preamble):
{
  "what_we_know": [
    {
      "finding": "string",
      "confidence": "Known | Probable | Assumed"
    }
  ],
  "what_we_dont_know": ["string"],
  "assumption_status": [
    {
      "assumption": "string",
      "status": "confirm | contradict | inconclusive"
    }
  ],
  "highest_risk_assumption": "string",
  "next_step": "string"
}
"""

    return Task(
        description=description + f"\n\n**OUTPUT FORMAT (JSON only):**\n{json_schema}",
        expected_output=(
            "Valid JSON with what_we_know array (with confidence levels), what_we_dont_know, "
            "assumption_status for each HIGH-risk assumption, highest_risk_assumption, and next_step."
        ),
        agent=agent,
    )
