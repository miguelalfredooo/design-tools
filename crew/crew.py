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
) -> dict:
    """
    Run three-agent handoff: PM → Research → Designer.
    Each agent reads the previous agent's output.
    """
    llm = get_llm()

    # Initialize agents
    pm_agent = create_pm(llm)
    research_agent = create_research_insights(llm, tools=[fetch_evidence])
    design_agent = create_product_design(llm)

    # Build base context
    base_context = {
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

    # STEP 1: PM frames and surfaces assumptions
    pm_context = base_context.copy()
    pm_task = create_frame_objective_task(pm_agent, pm_context)
    pm_crew = Crew(
        agents=[pm_agent],
        tasks=[pm_task],
        process=Process.sequential,
        verbose=True,
    )
    pm_output = str(pm_crew.kickoff())

    # STEP 2: Research pressure-tests PM's output
    research_context = base_context.copy()
    research_context["pm_output"] = pm_output  # Pass PM output to Research
    research_task = create_synthesize_task(research_agent, research_context)
    research_crew = Crew(
        agents=[research_agent],
        tasks=[research_task],
        process=Process.sequential,
        verbose=True,
    )
    research_output = str(research_crew.kickoff())

    # STEP 3: Designer proposes ideas to validate highest-risk assumption
    design_context = base_context.copy()
    design_context["research_output"] = research_output  # Pass Research output to Designer
    design_task = create_recommend_solution_task(design_agent, design_context)
    design_crew = Crew(
        agents=[design_agent],
        tasks=[design_task],
        process=Process.sequential,
        verbose=True,
    )
    design_output = str(design_crew.kickoff())

    # Return individual outputs
    return {
        "pm_frame": pm_output,
        "research_synthesis": research_output,
        "design_recommendation": design_output,
        "full_output": f"PM:\n{pm_output}\n\nRESEARCH:\n{research_output}\n\nDESIGN:\n{design_output}"
    }


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
