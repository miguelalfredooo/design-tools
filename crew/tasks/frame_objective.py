from crewai import Task, Agent


def create_frame_objective_task(agent: Agent, context: dict) -> Task:
    """
    PM frames whether this is worth solving and surfaces ranked assumptions for Research to pressure-test.
    Output is a handoff, not a document.
    """
    problem = context.get("problem_statement", "")
    objective = context.get("objective", "")
    metric = context.get("metric", "")
    constraints = context.get("constraints", {})
    why_now = context.get("why_now", "")
    stage = context.get("stage", "discovery")

    # Gate check
    parts = [
        "**GATE CHECK — answer these before framing anything:**\n"
        "1. Is the problem specific enough to design against?\n"
        "2. Do we know who specifically suffers from this — or are we assuming?\n"
        "3. Is there a measurable outcome, or is this a feeling?\n"
        "4. Why does this need to be solved now vs. next quarter?\n\n"
        "If any gate fails: name the gap. Do not proceed to framing.\n"
        "If all gates pass: continue to handoff.\n"
    ]

    if problem:
        parts.append(f"**Problem statement:** {problem}")
    else:
        parts.append("**Problem statement:** [MISSING — this is data]")

    if metric:
        parts.append(f"**Metric to move:** {metric}")
    else:
        parts.append("**Metric to move:** [MISSING — this is data]")

    if constraints:
        constraint_text = "\n  - ".join(f"{k}: {v}" for k, v in constraints.items())
        parts.append(f"**Hard constraints (non-negotiable):**\n  - {constraint_text}")

    if why_now:
        parts.append(f"**Why now:** {why_now}")
    else:
        parts.append("**Why now:** [MISSING — surface this if blank]")

    parts.extend([
        "\n**HANDOFF OUTPUT (if gates pass):**\n\n"
        "1. **Strategic frame** — problem (one sentence) + user (one phrase) + outcome (one number)\n\n"
        "2. **Business case** — why this, why now (two sentences max)\n\n"
        "3. **Ranked assumptions for Research** — 3–5 assumptions this brief rests on\n"
        "   Each assumption tagged: HIGH / MED / LOW risk-if-wrong\n"
        "   For each HIGH assumption: one sentence on what would prove us wrong\n\n"
        "4. **Hard constraints** — what is non-negotiable (time, tech, scope)\n\n"
        "5. **What we're NOT solving** — one explicit trade-off decision\n\n"
        "Do not produce a document. This is a handoff. Research will read the ranked assumptions "
        "and pressure-test them against data. Designer will read the hard constraints. Both will pressure-test what we say about 'proof of wrongness.'"
    ])

    return Task(
        description="\n".join(parts),
        expected_output=(
            "Handoff to Research:\n"
            "- Strategic frame (tight prose, not essay)\n"
            "- 3–5 ranked assumptions with risk levels (HIGH / MED / LOW)\n"
            "- For each HIGH: one sentence on what would prove it wrong\n"
            "- Hard constraints\n"
            "- One explicit trade-off decision\n\n"
            "If gates fail: name the gap and stop. Do not proceed to assumptions."
        ),
        agent=agent,
    )
