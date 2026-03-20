import { NextResponse } from "next/server";

const CREW_API_URL = process.env.CREW_API_URL || "http://localhost:8000";

export async function POST(request: Request) {
  const body = await request.json();
  const { prompt, synthesis_tier, problem_statement, user_segment, metric, constraints, previous_design_output, iteration } = body;

  if (!prompt) {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${CREW_API_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem_statement: problem_statement || prompt,
        user_segment: user_segment || "",
        metric: metric || "",
        synthesis_tier: synthesis_tier || "balanced",
        stage: "discovery",
        constraints: constraints || [],
        previous_design_output: previous_design_output || null,
        iteration: iteration || 1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `Crew service error: ${err}` },
        { status: 502 }
      );
    }

    // Pass through the SSE stream
    const stream = res.body;
    if (!stream) {
      return NextResponse.json(
        { error: "No response stream from crew service" },
        { status: 502 }
      );
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Crew service unavailable. Make sure the FastAPI server is running on port 8000.",
      },
      { status: 502 }
    );
  }
}
