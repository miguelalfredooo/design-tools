from crewai import Crew, Process, LLM

from agents import create_design_strategy, create_research_insights, create_design_directions
from tasks import create_frame_brief_task, create_synthesize_task, create_generate_directions_task
from tools import fetch_evidence


def get_mode_guidance(mode: str) -> str:
    if mode == "deep_dive":
        return (
            "SYNTHESIS MODE: Deep dive.\n"
            "- Go broad enough to cover major tradeoffs and scenarios.\n"
            "- Include richer objective mapping, risks, and evidence gaps.\n"
            "- Spend more attention on readiness and additional signals.\n"
        )
    if mode == "decision_memo":
        return (
            "SYNTHESIS MODE: Decision memo.\n"
            "- Produce a balanced output with recommendation, rationale, alternatives, and risks.\n"
            "- Keep it concise enough for a product review artifact.\n"
        )
    return (
        "SYNTHESIS MODE: Quick read.\n"
        "- Optimize for speed and scannability.\n"
        "- Lead with the clearest recommendation, confidence, assumptions, and next step.\n"
        "- Keep findings tight and avoid long evidence dumps.\n"
    )


def get_llm() -> LLM:
    import os
    provider = os.environ.get("CREW_MODEL_PROVIDER", "openai")

    if provider == "anthropic":
        model = os.environ.get("ANTHROPIC_CREW_MODEL", "claude-haiku-4-5-20251001")
        return LLM(
            model=f"anthropic/{model}",
            api_key=os.environ.get("ANTHROPIC_API_KEY"),
            max_tokens=4096,
        )

    model = os.environ.get("OPENAI_CREW_MODEL", "gpt-5.1-codex-mini")
    kwargs = {
        "model": f"openai/{model}",
        "api_key": os.environ.get("OPENAI_API_KEY"),
    }
    base_url = os.environ.get("OPENAI_API_BASE")
    if base_url:
        kwargs["base_url"] = base_url
    return LLM(**kwargs)


def run_crew(prompt: str, objectives: list[dict], mode: str = "quick_read") -> str:
    llm = get_llm()
    evidence_topic = prompt[:160]
    evidence_days = 30
    session_limit = 6
    observation_limit = 12
    include_comments = True

    if mode == "quick_read":
        evidence_days = 14
        session_limit = 3
        observation_limit = 6
        include_comments = False

    if mode == "decision_memo":
        evidence_days = 21
        session_limit = 4
        observation_limit = 8

    try:
        evidence_text = fetch_evidence.run(
            topic=evidence_topic,
            days=evidence_days,
            session_limit=session_limit,
            observation_limit=observation_limit,
            include_comments=include_comments,
        )
    except Exception as error:
        evidence_text = (
            "Evidence fetch failed. Treat the data as thin and state assumptions explicitly.\n"
            f"Fetch error: {error}"
        )

    research_insights = create_research_insights(llm)
    mode_guidance = get_mode_guidance(mode)
    synth_task = create_synthesize_task(
        research_insights, prompt, objectives, evidence_text, mode_guidance, mode
    )

    if mode == "quick_read":
        crew = Crew(
            agents=[research_insights],
            tasks=[synth_task],
            process=Process.sequential,
            verbose=False,
        )
    else:
        design_strategy = create_design_strategy(llm)
        brief_task = create_frame_brief_task(design_strategy, prompt, objectives, mode_guidance)
        crew = Crew(
            agents=[design_strategy, research_insights],
            tasks=[brief_task, synth_task],
            process=Process.sequential,
            verbose=False,
        )

    result = crew.kickoff()
    return str(result)


def run_directions_crew(
    observations: list[dict],
    segments: list[dict],
    objectives: list[dict],
    modules: list[dict],
) -> str:
    llm = get_llm()
    agent = create_design_directions(llm)
    task = create_generate_directions_task(agent, observations, segments, objectives, modules)
    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=False,
    )
    result = crew.kickoff()
    return str(result)


if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()

    result = run_crew(
        prompt="What patterns are emerging from recent user research?",
        objectives=[
            {
                "title": "Improve activation",
                "metric": "Activation rate",
                "target": "50%",
                "description": "Increase new user activation from 40% to 50%",
            }
        ],
    )
    print("\n=== CREW RESULT ===")
    print(result)
