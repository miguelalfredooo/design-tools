import asyncio
import json
import os
import uuid
from datetime import datetime

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

load_dotenv()

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
    problem_statement = body.get("problem_statement")
    objective = body.get("objective")
    hypothesis = body.get("hypothesis")
    user_segment = body.get("user_segment")
    metric = body.get("metric")
    constraints = body.get("constraints")
    research_data = body.get("research_data", {})

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
                "problem": problem_statement,
            }),
        }

        try:
            from crew import run_crew as _run_crew

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                _run_crew,
                stage,
                problem_statement,
                objective,
                hypothesis,
                user_segment,
                metric,
                constraints,
                research_data,
            )

            # PM Agent Output
            yield {
                "event": "agent_message",
                "data": json.dumps({
                    "from": "product_manager",
                    "from_name": "Product Manager",
                    "to": "research_insights",
                    "subject": "Objective frame",
                    "priority": "standard",
                    "confidence": "n/a",
                    "body": result,
                    "timestamp": datetime.now().isoformat(),
                }),
            }

            # Research & Insights Output
            yield {
                "event": "agent_message",
                "data": json.dumps({
                    "from": "research_insights",
                    "from_name": "Research & Insights",
                    "to": "product_designer" if stage != "discovery" else "product_manager",
                    "subject": "Evidence synthesis",
                    "priority": "standard",
                    "confidence": "medium",
                    "body": result,
                    "timestamp": datetime.now().isoformat(),
                }),
            }

            # Design Output (if not discovery)
            if stage != "discovery":
                yield {
                    "event": "agent_message",
                    "data": json.dumps({
                        "from": "product_designer",
                        "from_name": "Product Designer",
                        "to": "product_manager",
                        "subject": "Design recommendation",
                        "priority": "standard",
                        "confidence": "medium",
                        "body": result,
                        "timestamp": datetime.now().isoformat(),
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
            yield {
                "event": "error",
                "data": json.dumps({
                    "run_id": run_id,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat(),
                }),
            }

    return EventSourceResponse(event_stream())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
