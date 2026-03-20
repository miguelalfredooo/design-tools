from crewai import Task, Agent


def create_recommend_solution_task(agent: Agent, context: dict) -> Task:
    """
    Product Design proposes solutions based on research insights and constraints.
    Evaluates trade-offs and feasibility.
    Tier affects output depth: quick (direction only), balanced (standard), in-depth (thorough).
    """
    problem = context.get("problem_statement", "")
    metric = context.get("metric", "")
    constraints = context.get("constraints", {})
    stage = context.get("stage", "solution")
    synthesis_tier = context.get("synthesis_tier", "balanced")
    research_data = context.get("research_data", {})

    # Build prompt based on available context
    parts = [
        "**YOU ARE PRODUCT DESIGNER.** Your job is NOT to summarize research or PM strategy.\n"
        "Focus ONLY on: Interaction design, specific flows, craft details, feasibility.\n"
        "Design 2-3 concrete ideas. Think in flows, interactions, what specifically changes:\n"
        "- Bad: 'Improve the onboarding'\n"
        "- Good: 'Remove role selector, auto-detect from email domain, cut onboarding from 5 screens to 2'\n\n"
        "Show your design thinking. What's the interaction? What's intuitive? What's feasible? What breaks?\n"
    ]

    if problem:
        parts.append(f"PROBLEM: {problem}")
    if metric:
        parts.append(f"METRIC TO IMPROVE: {metric}")
    if constraints:
        constraint_text = "\n".join(f"  - {k}: {v}" for k, v in constraints.items())
        parts.append(f"CONSTRAINTS:\n{constraint_text}")

    # Reference existing explorations or guide design-driven discovery
    has_research = research_data.get("prototypes_tested") or research_data.get("images")

    if has_research:
        if research_data.get("prototypes_tested"):
            parts.append(f"\nEXISTING EXPLORATIONS: Review the prototypes that have been tested and voted on.")
            parts.append(f"Build on consensus where it exists. If you deviate, explain why.")

        if research_data.get("images"):
            parts.append(f"\nDESIGN REFERENCES: Consider existing images/mockups when proposing your solution.")
    else:
        parts.append(
            f"\nNOTE: No design exploration data yet. That's fine — ground your solution in the problem frame and constraints.\n"
            f"Your job: Propose concrete designs based on the problem statement, metric, and feasibility.\n"
            f"Be specific about interactions and flows. Then propose the validation approach:\n"
            f"  - What should we prototype first?\n"
            f"  - What specific user flows should we test?\n"
            f"  - How will we know if this direction is right?"
        )

    # Design tier guidance
    if synthesis_tier == "quick":
        parts.extend([
            "\nDESIGN TIER: QUICK",
            "Be snappy. Direction only—one clear approach, top 2 trade-offs.",
            "Skip detailed interactions and feasibility deep dives.",
        ])
    elif synthesis_tier == "in-depth":
        parts.extend([
            "\nDESIGN TIER: IN-DEPTH",
            "Go thorough. Consider why you didn't choose alternative approaches.",
            "Detail feasibility, risks, and all stakeholder considerations.",
        ])

    parts.extend([
        "\n**Propose 2-3 specific MVP ideas. Be concrete:**",
        "- Bad: 'Improve the onboarding experience'",
        "- Good: 'Cut onboarding from 5 screens to 2 by auto-detecting role and skipping irrelevant questions'",
        "\nFor each idea:",
        "1. What's the specific change? (not generic 'improve X')",
        "2. Why this? (grounded in research, user feedback, metric impact)",
        "3. What's the trade-off? (speed vs. delight, depth vs. simplicity, etc.)",
        "4. How feasible? (timeline, tech risk, resource needs)",
        "5. What do we test first? (specific validation step)",
        "\nConsider existing explorations and stakeholder votes. Build on consensus.",
    ])

    # Tier-specific expected output
    if synthesis_tier == "quick":
        expected_output = (
            "QUICK DESIGN DIRECTION (snappy, directional):\n"
            "- DIRECTION: one-sentence approach\n"
            "- WHY: brief rationale\n"
            "- TOP 2 TRADE-OFFS: what you're optimizing vs. what you're trading\n"
            "- NEXT STEP: one action (prototype or test)"
        )
    elif synthesis_tier == "in-depth":
        if has_research:
            expected_output = (
                "DETAILED DESIGN RECOMMENDATION:\n"
                "- DIRECTION: one-sentence design approach\n"
                "- RATIONALE: why this (grounded in research, consensus, constraints)\n"
                "- KEY INTERACTIONS: 3-5 core user flows\n"
                "- TRADE-OFFS: what you're optimizing for vs. what you're trading\n"
                "- ALTERNATIVES CONSIDERED: why you didn't choose approach X, Y, or Z\n"
                "- FEASIBILITY: timeline, technical risks, resource needs, org friction\n"
                "- STAKEHOLDER ALIGNMENT: which existing explorations this builds on\n"
                "- RISKS & MITIGATIONS: what could go wrong and how to prevent it\n"
                "- NEXT STEP: prototype → test → implement\n"
                "- LINKS: references to Figma, explorations, prototypes"
            )
        else:
            expected_output = (
                "DESIGN RECOMMENDATION WITH VALIDATION ROADMAP:\n"
                "- DIRECTION: one-sentence design approach grounded in the problem frame\n"
                "- RATIONALE: why this solves the problem (not grounded in user research yet — be explicit about assumptions)\n"
                "- KEY INTERACTIONS: 3-5 core user flows and craft decisions\n"
                "- TRADE-OFFS: what you're optimizing vs. what you're trading\n"
                "- ALTERNATIVES CONSIDERED: why you didn't choose approach X, Y, or Z\n"
                "- FEASIBILITY: timeline, technical risks, resource needs\n"
                "- ASSUMPTIONS TO VALIDATE: what user behavior or preferences we're assuming\n"
                "- PROTOTYPE ROADMAP: what to build first, in what order, and why\n"
                "- VALIDATION PLAN: what to test, with whom, and what we'll learn\n"
                "- RISKS & MITIGATIONS: what could be wrong about our assumptions and how to catch it\n"
                "- NEXT STEP: build prototype → run usability test → iterate\n"
                "Write like you're designing an experiment, not implementing a known solution."
            )
    else:  # balanced (default)
        if has_research:
            expected_output = (
                "Design 2-3 specific ideas. For each: what changes, why it works, what the craft details are, "
                "what's the feasibility, what do we test. Write like you're describing a prototype to the team, not filling a form.\n"
                "- NEXT STEP: prototype → test → implement\n"
                "- LINKS: references to Figma, explorations, prototypes"
            )
        else:
            expected_output = (
                "Design 2-3 specific ideas grounded in the problem frame. For each: what specifically changes, "
                "why this solves the problem, what the key interactions are, feasibility, and what to validate first.\n"
                "Be concrete about flows and craft. Then lay out the validation roadmap:\n"
                "- PROTOTYPE FOCUS: what core interaction to build first\n"
                "- TEST APPROACH: what specific user flows or scenarios to test\n"
                "- SUCCESS CRITERIA: how we'll know this direction is right\n"
                "Write like you're proposing an experiment, not assuming we have user data."
            )

    return Task(
        description="\n".join(parts),
        expected_output=expected_output,
        agent=agent,
    )
