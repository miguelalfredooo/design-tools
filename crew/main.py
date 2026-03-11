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

app = FastAPI(title="Design Ops Crew API")


@app.get("/health")
async def health():
    """Check service health and Ollama connectivity."""
    ollama_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
    ollama_status = "unknown"

    try:
        import httpx
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{ollama_url}/api/tags")
            if resp.status_code == 200:
                models = resp.json().get("models", [])
                model_names = [m.get("name", "") for m in models]
                ollama_status = "ok"
            else:
                ollama_status = "error"
                model_names = []
    except Exception:
        ollama_status = "unavailable"
        model_names = []

    return {
        "status": "ok",
        "ollama": ollama_status,
        "models": model_names,
        "configured_model": os.environ.get("OLLAMA_MODEL", "qwen3.5"),
    }


@app.post("/run")
async def run_crew(request: Request):
    """Run the Design Ops crew and stream results via SSE."""
    body = await request.json()
    prompt = body.get("prompt", "")
    objectives = body.get("objectives", [])

    if not prompt:
        return JSONResponse(
            {"error": "prompt is required"},
            status_code=400,
        )

    run_id = str(uuid.uuid4())

    async def event_stream():
        # Send run start event
        yield {
            "event": "run_start",
            "data": json.dumps({
                "run_id": run_id,
                "started_at": datetime.now().isoformat(),
                "prompt": prompt,
            }),
        }

        # Send Oracle thinking event
        yield {
            "event": "agent_start",
            "data": json.dumps({
                "agent": "ORACLE",
                "agent_id": "design_ops_manager",
                "status": "thinking",
            }),
        }

        # Run the crew in a thread to avoid blocking
        try:
            from crew import run_crew as _run_crew

            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, _run_crew, prompt, objectives)

            # Parse the result into agent messages
            # CrewAI returns the final output as a string
            # We'll structure it as agent messages

            # Oracle's brief message
            yield {
                "event": "agent_message",
                "data": json.dumps({
                    "from": "design_ops_manager",
                    "from_name": "ORACLE",
                    "to": "research_synthesizer",
                    "subject": f"Research brief: {prompt[:80]}",
                    "priority": "standard",
                    "confidence": "n/a",
                    "assumptions": "Based on available evidence in the database. Scoped to last 30 days.",
                    "body": f"Directing Meridian to analyze: {prompt}",
                    "next_step": "Meridian to pull evidence and synthesize",
                    "timestamp": datetime.now().isoformat(),
                }),
            }

            # Meridian's synthesis message (the actual crew output)
            yield {
                "event": "agent_message",
                "data": json.dumps({
                    "from": "research_synthesizer",
                    "from_name": "MERIDIAN",
                    "to": "design_ops_manager",
                    "subject": f"Synthesis: {prompt[:60]}",
                    "priority": "standard",
                    "confidence": "medium",
                    "assumptions": "Analysis based on available observations and session data.",
                    "body": result,
                    "next_step": "Review findings and consider prototyping recommendations.",
                    "timestamp": datetime.now().isoformat(),
                }),
            }

            # Oracle's final summary
            yield {
                "event": "agent_message",
                "data": json.dumps({
                    "from": "design_ops_manager",
                    "from_name": "ORACLE",
                    "to": "user",
                    "subject": "Synthesis complete — review recommendations",
                    "priority": "standard",
                    "confidence": "medium",
                    "assumptions": "Recommendations are directional. Validate with additional research before committing.",
                    "body": (
                        "Meridian has completed the synthesis. Review the findings above and note "
                        "the confidence levels on each pattern. Recommendations with High confidence "
                        "can be acted on. Medium and Low confidence findings should be validated with "
                        "additional evidence before committing resources."
                    ),
                    "next_step": "Prioritize high-confidence recommendations for prototyping.",
                    "timestamp": datetime.now().isoformat(),
                }),
            }

            # Send completion event
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
