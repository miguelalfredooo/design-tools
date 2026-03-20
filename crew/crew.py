from crewai import Crew, Process, LLM
from typing import Optional, Any

try:
    # When running as a module
    from .agents import create_pm, create_research_insights, create_product_design
    from .tasks import create_frame_objective_task, create_synthesize_task, create_recommend_solution_task
    from .tools import fetch_evidence
except ImportError:
    # When running standalone with uvicorn
    from agents import create_pm, create_research_insights, create_product_design
    from tasks import create_frame_objective_task, create_synthesize_task, create_recommend_solution_task
    from tools import fetch_evidence


def get_llm() -> LLM:
    import os
    return LLM(
        model="claude-haiku-4-5-20251001",
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )


def run_crew(
    stage: str = "discovery",
    synthesis_tier: str = "balanced",
    problem_statement: Optional[str] = None,
    objective: Optional[str] = None,
    hypothesis: Optional[str] = None,
    user_segment: Optional[str] = None,
    metric: Optional[str] = None,
    constraints: Optional[dict] = None,
    research_data: Optional[dict] = None,
) -> str:
    """
    Run the three-agent crew with modular inputs.

    Args:
        stage: 'discovery', 'validation', 'solution', or 'optimization'
        synthesis_tier: 'quick', 'balanced' (default), or 'in-depth'
        problem_statement: The problem we're solving
        objective: The business objective
        hypothesis: What we're testing
        user_segment: Who we're solving for
        metric: What we're measuring
        constraints: Timeline, technical, budget, scope
        research_data: Dict with 'snowflake_results', 'surveys', 'prototypes_tested', 'images', etc.
    """
    llm = get_llm()

    # Initialize agents
    pm_agent = create_pm(llm)
    research_agent = create_research_insights(llm, tools=[fetch_evidence])
    design_agent = create_product_design(llm)

    # Build context from inputs
    context = {
        "stage": stage,
        "synthesis_tier": synthesis_tier,
        "problem_statement": problem_statement,
        "objective": objective,
        "hypothesis": hypothesis,
        "user_segment": user_segment,
        "metric": metric,
        "constraints": constraints or {},
        "research_data": research_data or {},
    }

    # Build tasks based on stage
    tasks = []

    # PM always frames (if we have context to frame)
    if any([objective, problem_statement, metric, constraints]):
        frame_task = create_frame_objective_task(pm_agent, context)
        tasks.append(frame_task)

    # Research always synthesizes
    synth_task = create_synthesize_task(research_agent, context)
    tasks.append(synth_task)

    # Design proposes solutions (except in discovery)
    if stage != "discovery":
        recommend_task = create_recommend_solution_task(design_agent, context)
        tasks.append(recommend_task)

    # Build crew with available agents and tasks
    agents = [pm_agent, research_agent]
    if stage != "discovery":
        agents.append(design_agent)

    crew = Crew(
        agents=agents,
        tasks=tasks,
        process=Process.sequential,
        verbose=True,
    )

    # Execute and capture individual task outputs
    result = crew.kickoff()

    # Return structured output with individual agent results
    output = {
        "pm_frame": "",
        "research_synthesis": "",
        "design_recommendation": "",
        "full_output": str(result)
    }

    # Extract crew result as string
    result_str = str(result) if result else ""

    # For now, use the full crew output for both pm_frame and research_synthesis
    # The crew produces a complete synthesis that includes both strategic framing and evidence
    # The frontend will display both cards with this content
    output["pm_frame"] = result_str
    output["research_synthesis"] = result_str

    return output


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    # Example 1: Discovery phase with minimal input
    result = run_crew(
        stage="discovery",
        problem_statement="Users struggle to find relevant products in search",
        user_segment="Mobile users, first-time visitors",
    )
    print("\n=== DISCOVERY RESULT ===")
    print(result)

    # Example 2: Solution phase with full context
    # result = run_crew(
    #     stage="solution",
    #     problem_statement="Users abandon checkout at payment step",
    #     objective="Improve checkout conversion to 80%",
    #     metric="Checkout completion rate",
    #     constraints={"timeline": "4 weeks", "technical": "Payment provider limitation"},
    #     research_data={
    #         "snowflake_results": "18% drop-off at payment step",
    #         "survey_responses": "Users report 'too many fields'",
    #         "prototypes_tested": [{"name": "Auto-fill form", "votes": 9}],
    #     },
    # )
    # print("\n=== SOLUTION RESULT ===")
    # print(result)
