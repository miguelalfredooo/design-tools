import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  generateSynthesisText,
  getSynthesisModelName,
  parseLLMJSON,
} from "@/lib/synthesis-llm";
import type {
  ObservationRow,
  SegmentRow,
  ObservationSynthesisResponse,
  SegmentItemRow,
} from "@/lib/research-hub-types";

interface ProjectBrief {
  problem_statement?: string | null;
  idea?: string | null;
  what_we_are_building?: string | null;
  assumptions?: string | null;
  out_of_scope?: string | null;
}

function buildBriefSection(brief: ProjectBrief): string {
  const lines: string[] = [];
  if (brief.problem_statement) lines.push(`Research question: ${brief.problem_statement}`);
  if (brief.idea) lines.push(`Working hypothesis: ${brief.idea}`);
  if (brief.what_we_are_building) lines.push(`What we're building / testing:\n${brief.what_we_are_building}`);
  if (brief.assumptions) lines.push(`Assumptions to validate:\n${brief.assumptions}`);
  if (brief.out_of_scope) lines.push(`Out of scope:\n${brief.out_of_scope}`);
  return lines.length > 0 ? lines.join("\n\n") : "No project brief provided.";
}

function buildPrompt(
  observations: ObservationRow[],
  segments: SegmentRow[],
  brief: ProjectBrief
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

  const briefSection = buildBriefSection(brief);

  return `You are a UX research analyst helping synthesize user observations into structured insights organized by user segment.

Use the project brief below as your primary lens. Every insight should be framed relative to the research question, hypothesis, and features being tested. Explicitly pressure-test the stated assumptions against the observations. Do not surface insights about areas listed as out of scope.

--- PROJECT BRIEF ---
${briefSection}
--- END PROJECT BRIEF ---

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
      "body": "1-2 sentence explanation grounded in the observations and relevant to the project brief",
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
- Frame all insights through the lens of the research question and hypothesis
- When an observation directly supports or challenges a stated assumption, surface it as an actionable_insight
- Omit or deprioritize observations that fall under out of scope areas
- Map each insight to the most fitting existing segment. Only suggest new segments when observations clearly don't fit any existing one
- source_observation_ids must reference actual observation IDs from the data above
- Use plain language suitable for stakeholder briefs
- Group related observations into single insights rather than 1:1 mapping
- suggested_segments should be empty if all insights fit existing segments
- Return ONLY valid JSON, no markdown wrapping`;
}

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { observationIds, projectId } = await req.json();

  if (!observationIds || !Array.isArray(observationIds) || observationIds.length === 0) {
    return NextResponse.json(
      { error: "observationIds array is required" },
      { status: 400 }
    );
  }

  // Fetch selected observations, segments, and project brief in parallel
  let obsQuery = db
    .from("research_observations")
    .select("*")
    .in("id", observationIds);
  if (projectId) obsQuery = obsQuery.eq("project_id", projectId);

  let segQuery = db
    .from("research_segments")
    .select("*")
    .order("created_at", { ascending: true });
  if (projectId) segQuery = segQuery.eq("project_id", projectId);

  const briefPromise = projectId
    ? db.from("research_projects").select("problem_statement, idea, what_we_are_building, assumptions, out_of_scope").eq("id", projectId).single()
    : Promise.resolve({ data: null });

  const [obsRes, segRes, briefRes] = await Promise.all([obsQuery, segQuery, briefPromise]);

  if (obsRes.error) {
    return NextResponse.json({ error: obsRes.error.message }, { status: 500 });
  }

  const observations = obsRes.data as ObservationRow[];
  const segments = (segRes.data ?? []) as SegmentRow[];
  const brief: ProjectBrief = briefRes.data ?? {};

  if (observations.length === 0) {
    return NextResponse.json(
      { error: "No observations found for given IDs" },
      { status: 400 }
    );
  }

  // Build prompt and call configured synthesis provider
  const prompt = buildPrompt(observations, segments, brief);

  let rawResponse: string;
  try {
    rawResponse = await generateSynthesisText(prompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Synthesis request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let synthesis: ObservationSynthesisResponse;
  try {
    synthesis = parseLLMJSON<ObservationSynthesisResponse>(rawResponse);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to parse synthesis response as JSON",
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
        .insert({
          name: suggested.name,
          description: suggested.description,
          project_id: projectId || '00000000-0000-0000-0000-000000000001',
        })
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
    // Clear existing items for affected segments before inserting fresh results
    const affectedSegmentIds = [...new Set(rows.map((r) => r.segment_id))];
    await db
      .from("research_segment_items")
      .delete()
      .in("segment_id", affectedSegmentIds);

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
    model: getSynthesisModelName(),
    insightCount: rows.length,
    newSegments: synthesis.suggested_segments.length,
  });
}
