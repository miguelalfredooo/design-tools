import { NextResponse } from "next/server";

const CREW_API_URL = process.env.CREW_API_URL || "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${CREW_API_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({
        status: "unavailable",
        ollama: "unknown",
        models: [],
        configuredModel: "unknown",
      });
    }

    const data = await res.json();
    return NextResponse.json({
      status: "ok",
      ollama: data.ollama,
      models: data.models,
      configuredModel: data.configured_model,
    });
  } catch {
    return NextResponse.json({
      status: "unavailable",
      ollama: "unknown",
      models: [],
      configuredModel: "unknown",
    });
  }
}
