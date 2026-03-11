from crewai import Task, Agent


def create_synthesize_task(agent: Agent, prompt: str, objectives: list[dict]) -> Task:
    objectives_text = "\n".join(
        f"- {obj.get('title', '')}: {obj.get('metric', '')} → {obj.get('target', '')}"
        for obj in objectives
    ) or "No specific objectives defined."

    return Task(
        description=(
            f"You are Meridian, the User Research & Insight Analyst.\n\n"
            f"ANALYSIS FOCUS: {prompt}\n\n"
            f"BUSINESS OBJECTIVES TO MAP AGAINST:\n{objectives_text}\n\n"
            f"Your job:\n"
            f"1. Use the 'Fetch Research Evidence' tool to pull relevant observations, "
            f"sessions, votes, and comments from the database\n"
            f"2. Analyze the evidence using your two-pass method: what's in the data → what it likely means\n"
            f"3. Map findings to the business objectives above\n"
            f"4. Label every finding with a confidence level (High/Medium/Low)\n"
            f"5. State assumptions explicitly\n"
            f"6. End with concrete recommendations tied to specific objectives\n\n"
            f"Rules:\n"
            f"- Ground synthesis in what the data actually says\n"
            f"- Flag inferences vs direct findings\n"
            f"- Distinguish pain points from satisficing (users adapting to broken things)\n"
            f"- A directional insight with stated assumptions is better than silence\n"
            f"- Never fabricate evidence. If data is thin, say so."
        ),
        expected_output=(
            "A structured synthesis that includes:\n"
            "- SUBJECT: one-line summary of the key finding\n"
            "- CONFIDENCE: high / medium / low\n"
            "- ASSUMPTIONS: what this analysis takes as given\n"
            "- FINDINGS: 2-5 key patterns found in the evidence, each with:\n"
            "  - Pattern description\n"
            "  - Evidence references (which observations, sessions, or votes support this)\n"
            "  - Confidence level for this specific pattern\n"
            "- OBJECTIVE MAPPING: how findings connect to each business objective\n"
            "- RECOMMENDATIONS: 1-3 concrete design recommendations, each tied to a specific objective\n"
            "- NEXT STEPS: what should happen next to validate or act on these findings"
        ),
        agent=agent,
    )
