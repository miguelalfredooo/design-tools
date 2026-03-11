from crewai import Task, Agent


def create_frame_brief_task(agent: Agent, prompt: str, objectives: list[dict]) -> Task:
    objectives_text = "\n".join(
        f"- {obj.get('title', '')}: {obj.get('metric', '')} → {obj.get('target', '')}"
        f" ({obj.get('description', '')})"
        for obj in objectives
    ) or "No specific objectives defined."

    return Task(
        description=(
            f"You are Oracle, the Chief Design Officer. A user has requested a design ops synthesis.\n\n"
            f"USER PROMPT: {prompt}\n\n"
            f"BUSINESS OBJECTIVES:\n{objectives_text}\n\n"
            f"Your job:\n"
            f"1. Reframe the user's prompt into a clear research brief\n"
            f"2. Connect it to the business objectives above\n"
            f"3. Frame the brief with: Objective → What we have → What we're assuming → Desired output\n"
            f"4. Direct Meridian (the research synthesizer) to pull evidence and produce a synthesis\n"
            f"5. Be specific about what evidence to look for and how to scope the analysis\n\n"
            f"Do NOT produce the synthesis yourself. Your job is to frame the brief clearly "
            f"so Meridian can do focused, high-quality research synthesis."
        ),
        expected_output=(
            "A structured brief that includes:\n"
            "- SUBJECT: one-line summary of the analysis focus\n"
            "- OBJECTIVE: what business goal this serves\n"
            "- WHAT WE HAVE: what evidence is available\n"
            "- ASSUMPTIONS: what we're taking as given\n"
            "- DESIRED OUTPUT: what Meridian should produce\n"
            "- SCOPE: specific areas or time ranges to focus on"
        ),
        agent=agent,
    )
