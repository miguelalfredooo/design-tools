from crewai import Task, Agent


def create_frame_brief_task(
    agent: Agent,
    prompt: str,
    objectives: list[dict],
    mode_guidance: str,
) -> Task:
    objectives_text = "\n".join(
        f"- {obj.get('title', '')}\n"
        f"  Metric: {obj.get('metric', '')}\n"
        f"  Target: {obj.get('target', '')}\n"
        f"  Segments: {', '.join(obj.get('segmentIds', [])) or 'none specified'}\n"
        f"  User stages: {', '.join(obj.get('lifecycleCohorts', [])) or 'none specified'}\n"
        f"  Theory of success: {obj.get('theoryOfSuccess', '')}\n"
        f"  Notes: {obj.get('description', '')}"
        for obj in objectives
    ) or "No specific objectives defined."

    return Task(
        description=(
            f"You are Design Strategy. A user has requested a design ops synthesis.\n\n"
            f"USER PROMPT: {prompt}\n\n"
            f"BUSINESS OBJECTIVES:\n{objectives_text}\n\n"
            f"{mode_guidance}\n"
            f"Your job:\n"
            f"1. Reframe the user's prompt into a clear research brief\n"
            f"2. Connect it to the business objectives above\n"
            f"3. Explicitly identify which segment or segment hypothesis this run applies to\n"
            f"4. Explicitly identify which user stage this run applies to when relevant\n"
            f"5. Determine which growth phase (Learning, Scaling, Expansion, Optimization) this run belongs to based on the objective and context\n"
            f"6. Frame the brief with: Objective → What we have → What we're assuming → Desired output\n"
            f"7. Direct Research & Insights to pull evidence and produce a synthesis\n"
            f"8. Be specific about what evidence to look for and how to scope the analysis\n\n"
            f"Output rules:\n"
            f"- Make progress even with partial information\n"
            f"- Do not block the run because some inputs are missing\n"
            f"- If the data is thin, explicitly say what additional signals would improve confidence\n"
            f"- Keep the brief concise and scannable\n\n"
            f"Do NOT produce the synthesis yourself. Your job is to frame the brief clearly "
            f"so Research & Insights can do focused, high-quality research synthesis."
        ),
        expected_output=(
            "A structured brief that includes:\n"
            "- SUBJECT: one-line summary of the analysis focus\n"
            "- OBJECTIVE: what business goal this serves\n"
            "- SEGMENT: which segment or segment hypothesis this applies to\n"
            "- USER STAGE: which user-behavior stage this applies to\n"
            "- PHASE: which growth phase this belongs to — Learning phase, Scaling phase, Expansion phase, or Optimization phase\n"
            "- READINESS: sufficient / partial / weak, with one sentence explaining why\n"
            "- WHAT WE HAVE: what evidence is available\n"
            "- ASSUMPTIONS: what we're taking as given\n"
            "- DESIRED OUTPUT: what Research & Insights should produce\n"
            "- METRIC TO MOVE: what KPI this should influence\n"
            "- SCOPE: specific areas or time ranges to focus on\n"
            "- WHAT WOULD IMPROVE CONFIDENCE: 1-3 additional signals worth gathering"
        ),
        agent=agent,
    )
