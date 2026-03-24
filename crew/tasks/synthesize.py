from crewai import Task, Agent


def create_synthesize_task(
    agent: Agent,
    prompt: str,
    objectives: list[dict],
    evidence_text: str,
    mode_guidance: str,
    mode: str = "quick_read",
) -> Task:
    objectives_text = "\n".join(
        f"- {obj.get('title', '')}\n"
        f"  Metric: {obj.get('metric', '')}\n"
        f"  Target: {obj.get('target', '')}\n"
        f"  Segments: {', '.join(obj.get('segmentIds', [])) or 'none specified'}\n"
        f"  User stages: {', '.join(obj.get('lifecycleCohorts', [])) or 'none specified'}\n"
        f"  Theory of success: {obj.get('theoryOfSuccess', '')}"
        for obj in objectives
    ) or "No specific objectives defined."

    expected_output = (
        "A structured synthesis that includes:\n"
        "- SUBJECT: one-line summary of the key finding\n"
        "- DETAILS: one short paragraph giving the important context behind the summary\n"
        "- CONFIDENCE: high / medium / low\n"
        "- READINESS: sufficient / partial / weak, with one sentence explaining why\n"
        "- TOP FINDINGS: the top 3 most important observations in short, scannable bullets\n"
        "- TOP NEEDS: the top 3 additional signals, risks, or validation needs in short, scannable bullets\n"
        "- RECOMMENDATION: the clearest move to make now, tied to a segment + metric\n"
        "- PHASE: which growth phase this belongs to — Learning phase, Scaling phase, Expansion phase, or Optimization phase — with one sentence of reasoning\n"
        "- ASSUMPTIONS: what this analysis takes as given\n"
        "- FINDINGS: 2-5 key patterns found in the evidence, each with:\n"
        "  - Pattern description\n"
        "  - Evidence references (which observations, sessions, or votes support this)\n"
        "  - Segment relevance\n"
        "  - User stage relevance\n"
        "  - Confidence level for this specific pattern\n"
        "- OBJECTIVE MAPPING: how findings connect to each business objective\n"
        "- ADDITIONAL SIGNALS WORTH GATHERING: 1-3 specific missing inputs, why each matters, and likely source\n"
        "- RECOMMENDATIONS: 1-3 concrete design recommendations, each tied to a specific objective\n"
        "- NEXT STEPS: what should happen next to validate or act on these findings\n"
        "- PRIORITIZATION NOTE: effort signal (low / medium / high) and whether this belongs "
        "in the current cycle or needs more validation first — 1-2 lines only"
    )

    if mode == "quick_read":
        expected_output = (
            "A fast, scannable synthesis that includes only:\n"
            "- SUBJECT: one-line summary of the key finding\n"
            "- DETAILS: one short paragraph of context\n"
            "- CONFIDENCE: high / medium / low\n"
            "- READINESS: sufficient / partial / weak, with one sentence explaining why\n"
            "- TOP FINDINGS: the top 3 most important observations in short bullets\n"
            "- TOP NEEDS: the top 3 missing signals, risks, or validation needs in short bullets\n"
            "- RECOMMENDATION: the clearest move to make now, tied to a segment + metric\n"
            "- PHASE: which growth phase this belongs to — Learning phase, Scaling phase, Expansion phase, or Optimization phase — with one sentence of reasoning\n"
            "- NEXT STEP: the most useful immediate action\n"
            "- PRIORITIZATION NOTE: effort signal (low / medium / high) and whether this is "
            "actionable now or needs more validation first — 1-2 lines only"
        )

    return Task(
        description=(
            f"You are Research & Insights.\n\n"
            f"ANALYSIS FOCUS: {prompt}\n\n"
            f"BUSINESS OBJECTIVES TO MAP AGAINST:\n{objectives_text}\n\n"
            f"AVAILABLE EVIDENCE:\n{evidence_text}\n\n"
            f"{mode_guidance}\n"
            f"Your job:\n"
            f"1. Analyze the evidence using your two-pass method: what's in the data → what it likely means\n"
            f"2. Map findings to the business objectives above\n"
            f"3. State which segment each major finding is relevant to\n"
            f"4. State which user stage each major finding is relevant to when applicable\n"
            f"5. Determine which growth phase (Learning, Scaling, Expansion, Optimization) the recommendation belongs to based on the evidence and objective\n"
            f"6. Label every finding with a confidence level (High/Medium/Low)\n"
            f"7. State assumptions explicitly\n"
            f"8. End with concrete recommendations tied to specific objectives\n\n"
            f"Rules:\n"
            f"- Ground synthesis in what the data actually says\n"
            f"- Flag inferences vs direct findings\n"
            f"- Distinguish pain points from satisficing (users adapting to broken things)\n"
            f"- A directional insight with stated assumptions is better than silence\n"
            f"- Never fabricate evidence. If data is thin, say so.\n"
            f"- Always include segment + metric in the recommendation framing.\n"
            f"- Include a short readiness judgment that explains whether the evidence is sufficient, partial, or weak.\n"
            f"- Always include the next 1-3 signals that would most improve confidence.\n"
            f"- Do not call external tools. Work only with the evidence provided in this prompt."
        ),
        expected_output=expected_output,
        agent=agent,
    )
