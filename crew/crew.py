from crewai import Crew, Process, LLM
from typing import Optional, Any

try:
    # When running as a module
    from .agents import create_pm, create_research_insights, create_product_design
    from .tasks import create_frame_objective_task, create_synthesize_task, create_recommend_solution_task
    from .tools import fetch_evidence
    from .schemas import parse_and_validate_pm, parse_and_validate_research, parse_and_validate_design
except ImportError:
    # When running standalone with uvicorn
    from agents import create_pm, create_research_insights, create_product_design
    from tasks import create_frame_objective_task, create_synthesize_task, create_recommend_solution_task
    from tools import fetch_evidence
    from schemas import parse_and_validate_pm, parse_and_validate_research, parse_and_validate_design


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
    previous_design_output: Optional[dict] = None,
    iteration: int = 1,
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
        "previous_design_output": previous_design_output or {},
        "iteration": iteration,
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
    pm_output_raw = str(pm_crew.kickoff())

    # Parse and validate PM output
    try:
        pm_output = parse_and_validate_pm(pm_output_raw)
    except Exception as e:
        import traceback
        print(f"\n❌ PM VALIDATION ERROR:\n{traceback.format_exc()}\nRaw output: {pm_output_raw[:500]}\n")
        raise ValueError(f"PM output validation failed: {str(e)}")

    # GATE 1: Check if PM passed gates
    if pm_output.get("status") == "fail":
        print(f"\n⚠️  PM GATE FAILED. Stopping crew.\nGaps: {pm_output.get('gaps', [])}\n")
        return {
            "pm_frame": pm_output,
            "research_synthesis": None,
            "design_recommendation": None,
            "stopped_at": "pm_gate_failed",
        }

    # STEP 2: Research pressure-tests PM's output
    # Pass ONLY assumptions array to Research
    research_context = base_context.copy()
    research_context["pm_assumptions"] = pm_output.get("assumptions", [])
    research_task = create_synthesize_task(research_agent, research_context)
    research_crew = Crew(
        agents=[research_agent],
        tasks=[research_task],
        process=Process.sequential,
        verbose=True,
    )
    research_output_raw = str(research_crew.kickoff())

    # Parse and validate Research output
    try:
        research_output = parse_and_validate_research(research_output_raw)
    except Exception as e:
        import traceback
        print(f"\n❌ RESEARCH VALIDATION ERROR:\n{traceback.format_exc()}\nRaw output: {research_output_raw[:500]}\n")
        raise ValueError(f"Research output validation failed: {str(e)}")

    # GATE 2: Check if Research identified highest-risk assumption
    highest_risk = research_output.get("highest_risk_assumption", "").strip()
    if not highest_risk:
        print(f"\n⚠️  RESEARCH GATE FAILED: No highest-risk assumption identified. Stopping crew.\n")
        return {
            "pm_frame": pm_output,
            "research_synthesis": research_output,
            "design_recommendation": None,
            "stopped_at": "research_gate_failed",
        }

    # STEP 3: Designer proposes ideas to validate highest-risk assumption
    # Pass ONLY highest_risk_assumption to Designer
    design_context = base_context.copy()
    design_context["highest_risk_assumption"] = highest_risk
    design_task = create_recommend_solution_task(design_agent, design_context)
    design_crew = Crew(
        agents=[design_agent],
        tasks=[design_task],
        process=Process.sequential,
        verbose=True,
    )
    design_output_raw = str(design_crew.kickoff())

    # Parse and validate Design output
    try:
        design_output = parse_and_validate_design(design_output_raw)
    except Exception as e:
        import traceback
        print(f"\n❌ DESIGN VALIDATION ERROR:\n{traceback.format_exc()}\nRaw output: {design_output_raw[:500]}\n")
        raise ValueError(f"Design output validation failed: {str(e)}")

    # Return individual outputs
    return {
        "pm_frame": pm_output,
        "research_synthesis": research_output,
        "design_recommendation": design_output,
        "stopped_at": None,
    }


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    # RAPTIVE CREATORS TEST CASE
    result = run_crew(
        stage="discovery",
        problem_statement=(
            "Creators are underengaged — no visibility into what's working, no tools to maintain presence efficiently. "
            "Reader retention and pageview revenue suffer when creators go silent."
        ),
        objective=(
            "Give creators visibility and control so the community becomes a place they're invested in — "
            "driving consistent posting, meaningful engagement, and measurable pageview lift."
        ),
        user_segment="Content creators on Raptive Community + their team members who manage presence on their behalf",
        metric="Consistent posting frequency + community engagement + pageview growth",
        constraints={
            "legal_review": "Behavioral data needs legal review",
            "authenticity": "Attribution of creator actions non-negotiable",
            "advertiser": "No advertiser conflicts",
            "defaults": "Conservative prompt defaults",
            "research": "6–8 creator interviews required before sprint"
        },
    )
    print("\n=== RAPTIVE CREATORS BRIEF ===")
    print("PM OUTPUT:")
    print(result["pm_frame"])
    print("\n" + "="*80 + "\n")
    print("RESEARCH OUTPUT:")
    print(result["research_synthesis"])
    print("\n" + "="*80 + "\n")
    print("DESIGN OUTPUT:")
    print(result["design_recommendation"])
