import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { generateWithOllama, getModelName, parseOllamaJSON } from "@/lib/ollama";
import type {
  ObservationRow,
  SegmentRow,
  ObservationSynthesisResponse,
  SegmentItemRow,
} from "@/lib/research-hub-types";

function buildPrompt(
  observations: ObservationRow[],
  segments: SegmentRow[]
): string {
  const obsLines = observations
    .map(
      (o) =>
        `[${o.id}] (${o.area}) ${o.body}${o.contributor ? ` — ${o.contributor}` : ""}${o.source_url ? ` (source: ${o.source_url})` : ""}`
    )
    .join("\n");

  const segLines =
    segments.length > 0
      ? segments
          .map((s) => `- "${s.name}"${s.description ? `: ${s.description}` : ""}`)
          .join("\n")
      : "No segments defined yet.";

  return `You are a UX research analyst helping synthesize user observations into structured insights organized by user segment.

Below are observations logged by product managers from session replays and stakeholder feedback.

--- OBSERVATIONS ---
${obsLines}
--- END OBSERVATIONS ---

--- EXISTING SEGMENTS ---
${segLines}
--- END SEGMENTS ---

Analyze these observations and respond with valid JSON in this exact structure:

{
  "insights": [
    {
      "segment": "Segment name (use existing segment if it fits, or propose a new one)",
      "bucket": "needs" | "pain_points" | "opportunities" | "actionable_insights",
      "title": "Short insight title",
      "body": "1-2 sentence explanation grounded in the observations",
      "source_observation_ids": ["uuid1", "uuid2"]
    }
  ],
  "suggested_segments": [
    {
      "name": "New segment name",
      "description": "Who this segment represents"
    }
  ]
}

Rules:
- Map each insight to the most fitting existing segment. Only suggest new segments when observations clearly don't fit any existing one.
- source_observation_ids must reference actual observation IDs from the data above
- Use plain language suitable for stakeholder briefs
- Group related observations into single insights rather than 1:1 mapping
- suggested_segments should be empty if all insights fit existing segments
- Return ONLY valid JSON, no markdown wrapping`;
}

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { observationIds } = await req.json();

  if (!observationIds || !Array.isArray(observationIds) || observationIds.length === 0) {
    return NextResponse.json(
      { error: "observationIds array is required" },
      { status: 400 }
    );
  }

  // Fetch selected observations and all segments
  const [obsRes, segRes] = await Promise.all([
    db
      .from("research_observations")
      .select("*")
      .in("id", observationIds),
    db
      .from("research_segments")
      .select("*")
      .order("created_at", { ascending: true }),
  ]);

  if (obsRes.error) {
    return NextResponse.json({ error: obsRes.error.message }, { status: 500 });
  }

  const observations = obsRes.data as ObservationRow[];
  const segments = (segRes.data ?? []) as SegmentRow[];

  if (observations.length === 0) {
    return NextResponse.json(
      { error: "No observations found for given IDs" },
      { status: 400 }
    );
  }

  // Build prompt and call Ollama
  const prompt = buildPrompt(observations, segments);

  let rawResponse: string;
  try {
    rawResponse = await generateWithOllama(prompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ollama request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let synthesis: ObservationSynthesisResponse;
  try {
    synthesis = parseOllamaJSON<ObservationSynthesisResponse>(rawResponse);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to parse Ollama response as JSON",
        raw: rawResponse.slice(0, 500),
      },
      { status: 502 }
    );
  }

  // Create any suggested segments first
  const segmentNameToId: Record<string, string> = {};
  for (const s of segments) {
    segmentNameToId[s.name] = s.id;
  }

  for (const suggested of synthesis.suggested_segments) {
    if (!segmentNameToId[suggested.name]) {
      const { data: newSeg } = await db
        .from("research_segments")
        .insert({ name: suggested.name, description: suggested.description })
        .select()
        .single();
      if (newSeg) {
        segmentNameToId[suggested.name] = (newSeg as SegmentRow).id;
      }
    }
  }

  // Store insights as segment items
  const batchId = crypto.randomUUID();
  const rows: Omit<SegmentItemRow, "id" | "created_at">[] = [];

  for (const insight of synthesis.insights) {
    const segmentId = segmentNameToId[insight.segment];
    if (!segmentId) continue;

    rows.push({
      segment_id: segmentId,
      bucket: insight.bucket,
      title: insight.title,
      body: insight.body,
      source_observation_ids: insight.source_observation_ids,
      batch_id: batchId,
    });
  }

  if (rows.length > 0) {
    const { error: insertErr } = await db
      .from("research_segment_items")
      .insert(rows);

    if (insertErr) {
      return NextResponse.json(
        { error: insertErr.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    batchId,
    model: getModelName(),
    insightCount: rows.length,
    newSegments: synthesis.suggested_segments.length,
  });
}
