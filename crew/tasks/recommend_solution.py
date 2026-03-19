from crewai import Task, Agent


def create_recommend_solution_task(agent: Agent, context: dict) -> Task:
    """
    Product Design proposes solutions based on research insights and constraints.
    Evaluates trade-offs and feasibility.
    """
    problem = context.get("problem_statement", "")
    metric = context.get("metric", "")
    constraints = context.get("constraints", {})
    stage = context.get("stage", "solution")
    research_data = context.get("research_data", {})

    # Build prompt based on available context
    parts = [
        "You are the Product Designer. Your job is to propose solutions grounded in research insights.\n"
    ]

    if problem:
        parts.append(f"PROBLEM: {problem}")
    if metric:
        parts.append(f"METRIC TO IMPROVE: {metric}")
    if constraints:
        constraint_text = "\n".join(f"  - {k}: {v}" for k, v in constraints.items())
        parts.append(f"CONSTRAINTS:\n{constraint_text}")

    # Reference existing explorations
    if research_data.get("prototypes_tested"):
        parts.append(f"\nEXISTING EXPLORATIONS: Review the prototypes that have been tested and voted on.")
        parts.append(f"Build on consensus where it exists. If you deviate, explain why.")

    if research_data.get("images"):
        parts.append(f"\nDESIGN REFERENCES: Consider existing images/mockups when proposing your solution.")

    parts.extend([
        "\nYour job:",
        "1. Propose a design direction grounded in the research insights above",
        "2. Consider existing explorations and stakeholder votes (consensus = less friction)",
        "3. Name key trade-offs: what you're optimizing for vs. what you're trading away",
        "4. Surface feasibility constraints early (timeline, technical, resources)",
        "5. Propose next steps (prototype, test, implement)",
        "\nBe concise. Name assumptions about users, technical constraints, and org friction.",
    ])

    return Task(
        description="\n".join(parts),
        expected_output=(
            "DESIGN RECOMMENDATION that includes:\n"
            "- DIRECTION: one-sentence design approach\n"
            "- RATIONALE: why this (grounded in research, consensus, constraints)\n"
            "- KEY INTERACTIONS: 3-5 core user flows\n"
            "- TRADE-OFFS: what you're optimizing for vs. what you're trading\n"
            "- FEASIBILITY: timeline, technical risks, resource needs\n"
            "- STAKEHOLDER ALIGNMENT: which existing explorations this builds on\n"
            "- NEXT STEP: prototype → test → implement\n"
            "- LINKS: references to Figma, explorations, prototypes"
        ),
        agent=agent,
    )
