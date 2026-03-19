from crewai import Crew, Process, LLM

from agents import create_oracle, create_meridian
from tasks import create_frame_brief_task, create_synthesize_task
from tools import fetch_evidence


def get_llm() -> LLM:
    import os
    return LLM(
        model="claude-haiku-4-5-20251001",
        api_key=os.environ.get("ANTHROPIC_API_KEY"),
    )


def run_crew(prompt: str, objectives: list[dict]) -> str:
    """Run the Design Ops crew with the given prompt and objectives."""
    llm = get_llm()

    oracle = create_oracle(llm)
    meridian = create_meridian(llm, tools=[fetch_evidence])

    brief_task = create_frame_brief_task(oracle, prompt, objectives)
    synth_task = create_synthesize_task(meridian, prompt, objectives)

    crew = Crew(
        agents=[oracle, meridian],
        tasks=[brief_task, synth_task],
        process=Process.sequential,
        verbose=True,
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
