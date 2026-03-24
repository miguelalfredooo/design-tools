from crewai import Task, Agent


def create_generate_directions_task(
    agent: Agent,
    observations: list[dict],
    segments: list[dict],
    objectives: list[dict],
    modules: list[dict],
) -> Task:
    # Format observations
    obs_text = "\n".join(
        f"- [{o.get('area', 'General')}] {o.get('body', '')} "
        f"(contributor: {o.get('contributor') or 'unknown'})"
        for o in observations[:40]
    ) or "No observations available."

    # Format segments with their items
    seg_lines = []
    for seg in segments:
        seg_lines.append(f"\nSegment: {seg.get('name', '')}")
        for item in seg.get("items", []):
            seg_lines.append(
                f"  [{item.get('bucket', '').upper()}] {item.get('title', '')}: {item.get('body', '')}"
            )
    seg_text = "\n".join(seg_lines) or "No segment insights available."

    # Format objectives
    obj_text = "\n".join(
        f"- {o.get('title', '')}\n"
        f"  Target: {o.get('target', '')}\n"
        f"  Theory: {o.get('theoryOfSuccess', '')}"
        for o in objectives
    ) or "No objectives defined."

    # Format modules
    mod_text = "\n".join(
        f"- [{m.get('status', '').upper()}] {m.get('name', '')}"
        + (f" — blocked: {m.get('blockedReason', '')}" if m.get('status') == 'blocked' else "")
        + (f" — next: {m.get('nextAction', '')}" if m.get('nextAction') else "")
        for m in modules
    ) or "No modules defined."

    style_guide = (
        "VOICE AND STYLE — read this carefully before writing anything.\n\n"
        "Write like a senior designer explaining an idea to a smart stakeholder — not like a product manager "
        "writing an acceptance criterion, and not like a researcher summarizing data.\n\n"
        "TITLE:\n"
        "- Pattern: 'A [thing] that [does something for the user]'\n"
        "- Verb-forward. User-outcome-focused. Reads as a complete thought.\n"
        "- Good: 'A weekly digest showing creators which posts actually drove results'\n"
        "- Good: 'A standalone mobile reply experience that works in two taps from any notification'\n"
        "- Bad: 'Post scheduling with batch queueing for advance content planning'\n"
        "- Bad: 'Real-time performance dashboard surfacing post engagement and topic resonance'\n\n"
        "PROBLEM:\n"
        "- One plain sentence describing the gap in experience — not the missing feature.\n"
        "- Good: 'Creators publish without feedback loops — they have no visibility into which posts drive real engagement or pageviews.'\n"
        "- Bad: 'Creators lack visibility into which posts are working, cannot see open rates...'\n\n"
        "IDEA:\n"
        "- Describe the interaction from the user's perspective — what they see, what they do, what happens.\n"
        "- Concrete enough to sketch. Readable, not a spec.\n"
        "- Avoid: percentages, SLAs, word counts as the primary frame. Let the experience lead.\n"
        "- Good: 'A weekly digest card that surfaces 3 posts ranked by engagement, with a plain-language annotation "
        "like \"This post drove 4x more replies than your average.\" Tapping any post shows a simple engagement curve "
        "vs. the creator's median. The data comes to the creator — no dashboard to navigate.'\n"
        "- Bad: 'A creator dashboard showing each post's comment count, total engagement score, days-to-peak-engagement...'\n\n"
        "WHY:\n"
        "- State a design principle as a truth — something you'd underline in a book.\n"
        "- Do NOT restate the problem. Do NOT cite authors or books.\n"
        "- Good: 'Organizations default to inside-out thinking — building without first understanding what the user is experiencing. "
        "The digest forces an outside-in shift by making the reader's behavior legible without requiring creators to become analysts.'\n"
        "- Good: 'Every product relationship has a lifecycle with detectable inflection points. Intervening at day 10 is a "
        "stage-transition move — not a panic response.'\n"
        "- Bad: 'Filtering by signal quality respects the creator's finite attention while preserving the moments...'\n\n"
        "RISK:\n"
        "- One sentence. Name the specific failure mode for THIS idea — not a generic caution.\n"
        "- Good: 'If the generated prompt feels off-brand or generic, it reads as surveillance rather than support and damages trust.'\n"
        "- Bad: 'Creators may use the edit window to change post meaning substantially...'\n"
    )

    return Task(
        description=(
            "You are Design Directions.\n\n"
            "Your job is to generate 5–8 concrete design directions from the research context below.\n\n"
            f"{style_guide}\n"
            f"RESEARCH OBSERVATIONS:\n{obs_text}\n\n"
            f"SEGMENT INSIGHTS (needs, pain points, opportunities, actionable insights):\n{seg_text}\n\n"
            f"BUSINESS OBJECTIVES:\n{obj_text}\n\n"
            f"DESIGN OPS MODULES (current status):\n{mod_text}\n\n"
            "Additional rules:\n"
            "- One problem per direction. Do not bundle.\n"
            "- MODULE should match a module name from the Design Ops list above if clearly relevant. Leave blank if not.\n"
            "- Do not fabricate data. Ground every direction in the research context above.\n\n"
            "Output each direction in EXACTLY this format, with no extra text between directions:\n\n"
            "DIRECTION\n"
            "TITLE: <one sentence, pattern: 'A [thing] that [does something for the user]'>\n"
            "PROBLEM: <one plain sentence describing the gap in experience>\n"
            "IDEA: <2-3 sentences describing the interaction from the user's perspective>\n"
            "WHY: <1-2 sentences stating a design principle as a truth — no author citations>\n"
            "RISK: <one sentence naming the specific failure mode for this idea>\n"
            "METRIC: <1-3 KPIs this direction is intended to move, e.g. 'Creator posting frequency · Reader retention rate'>\n"
            "MODULE: <matching module name or blank>\n"
            "END\n\n"
            "Repeat for each direction. Output nothing else."
        ),
        expected_output=(
            "5 to 8 design directions, each structured with DIRECTION / TITLE / PROBLEM / "
            "IDEA / WHY / RISK / METRIC / MODULE / END blocks. Written in the voice of a senior designer, "
            "not a product spec. No markdown, no extra commentary."
        ),
        agent=agent,
    )
