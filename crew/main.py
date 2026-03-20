import asyncio
import functools
import json
import os
import uuid
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

load_dotenv()

# Ensure API key is loaded from environment
if not os.environ.get("ANTHROPIC_API_KEY"):
    raise ValueError("ANTHROPIC_API_KEY environment variable is required")

app = FastAPI(title="Carrier Crew API")


@app.get("/health")
async def health():
    """Check service health and Claude API connectivity."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    anthropic_status = "ok" if api_key else "unconfigured"

    return {
        "status": "ok",
        "anthropic": anthropic_status,
        "model": "claude-haiku-4-5-20251001",
    }


@app.post("/run")
async def run_crew(request: Request):
    """Run the three-agent crew and stream results via SSE."""
    body = await request.json()

    # Extract modular inputs
    stage = body.get("stage", "discovery")
    synthesis_tier = body.get("synthesis_tier", "balanced")  # quick, balanced, in-depth
    problem_statement = body.get("problem_statement")
    objective = body.get("objective")
    hypothesis = body.get("hypothesis")
    user_segment = body.get("user_segment")
    metric = body.get("metric")
    constraints = body.get("constraints")
    research_data = body.get("research_data", {})
    previous_design_output = body.get("previous_design_output")
    iteration = body.get("iteration", 1)

    # Validate: at least one framing input
    if not any([problem_statement, objective, hypothesis]):
        return JSONResponse(
            {"error": "Provide at least one of: problem_statement, objective, or hypothesis"},
            status_code=400,
        )

    run_id = str(uuid.uuid4())

    async def event_stream():
        yield {
            "event": "run_start",
            "data": json.dumps({
                "run_id": run_id,
                "started_at": datetime.now().isoformat(),
                "stage": stage,
                "synthesis_tier": synthesis_tier,
                "problem": problem_statement,
            }),
        }

        try:
            try:
                from crew.crew import run_crew as _run_crew
            except ImportError:
                from crew import run_crew as _run_crew

            loop = asyncio.get_event_loop()
            crew_runner = functools.partial(
                _run_crew,
                stage=stage,
                synthesis_tier=synthesis_tier,
                problem_statement=problem_statement,
                objective=objective,
                hypothesis=hypothesis,
                user_segment=user_segment,
                metric=metric,
                constraints=constraints,
                research_data=research_data,
                previous_design_output=previous_design_output,
                iteration=iteration,
            )
            result = await loop.run_in_executor(None, crew_runner)

            # Extract individual outputs
            pm_output = result.get("pm_frame")
            research_output = result.get("research_synthesis")
            design_output = result.get("design_recommendation")
            stopped_at = result.get("stopped_at")

            # PM Agent Output (always included)
            yield {
                "event": "agent_message",
                "data": json.dumps({
                    "from": "product_manager",
                    "from_name": "Product Manager",
                    "to": "research_insights",
                    "subject": "Objective frame",
                    "priority": "high",
                    "confidence": "n/a",
                    "body": json.dumps(pm_output) if isinstance(pm_output, dict) else pm_output,
                    "timestamp": datetime.now().isoformat(),
                    "iteration": iteration,
                }),
            }

            # Check if gates failed
            if stopped_at == "pm_gate_failed":
                yield {
                    "event": "run_stopped",
                    "data": json.dumps({
                        "run_id": run_id,
                        "reason": "PM gate check failed",
                        "gaps": pm_output.get("gaps", []),
                        "timestamp": datetime.now().isoformat(),
                    }),
                }
            elif stopped_at == "research_gate_failed":
                # Include Research output before stopping
                yield {
                    "event": "agent_message",
                    "data": json.dumps({
                        "from": "research_insights",
                        "from_name": "Research & Insights",
                        "to": "product_designer",
                        "subject": "Evidence synthesis",
                        "priority": "high",
                        "confidence": "medium",
                        "body": json.dumps(research_output) if isinstance(research_output, dict) else research_output,
                        "timestamp": datetime.now().isoformat(),
                        "iteration": iteration,
                    }),
                }
                yield {
                    "event": "run_stopped",
                    "data": json.dumps({
                        "run_id": run_id,
                        "reason": "Research could not identify highest-risk assumption",
                        "timestamp": datetime.now().isoformat(),
                    }),
                }
            else:
                # Full handoff: Research output
                yield {
                    "event": "agent_message",
                    "data": json.dumps({
                        "from": "research_insights",
                        "from_name": "Research & Insights",
                        "to": "product_designer",
                        "subject": "Evidence synthesis",
                        "priority": "high",
                        "confidence": "medium",
                        "body": json.dumps(research_output) if isinstance(research_output, dict) else research_output,
                        "timestamp": datetime.now().isoformat(),
                        "iteration": iteration,
                    }),
                }

                # Design Output (only if gates passed)
                yield {
                    "event": "agent_message",
                    "data": json.dumps({
                        "from": "product_designer",
                        "from_name": "Product Designer",
                        "to": "product_manager",
                        "subject": "Design recommendation" if stage != "discovery" else "Design direction",
                        "priority": "high",
                        "confidence": "medium",
                        "body": json.dumps(design_output) if isinstance(design_output, dict) else design_output,
                        "timestamp": datetime.now().isoformat(),
                        "iteration": iteration,
                    }),
                }

            # Completion
            yield {
                "event": "run_complete",
                "data": json.dumps({
                    "run_id": run_id,
                    "completed_at": datetime.now().isoformat(),
                    "status": "completed",
                }),
            }

        except Exception as e:
            import traceback
            print(f"\n❌ ERROR in crew execution:\n{traceback.format_exc()}\n")
            yield {
                "event": "error",
                "data": json.dumps({
                    "run_id": run_id,
                    "error": str(e),
                    "error_type": type(e).__name__,
                    "traceback": traceback.format_exc(),
                    "timestamp": datetime.now().isoformat(),
                }),
            }

    return EventSourceResponse(event_stream())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
