import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  generateSynthesisText,
  getSynthesisModelName,
  parseLLMJSON,
} from "@/lib/synthesis-llm";
import { formatReplaysForPrompt } from "@/lib/replay-data";
import type { ResearchInsightRow } from "@/lib/research-types";

interface ReplayFriction {
  pattern: string;
  frequency: number;
  severity: "critical" | "high" | "medium" | "low";
}

interface ReplayImpact {
  metric: string;
  mentions: number;
  severity: "critical" | "high" | "medium" | "low";
}

interface ReplayMatrixItem {
  issue: string;
  effort: "small" | "medium" | "large";
  impact: "critical" | "high" | "medium" | "low";
  quadrant: "quick_win" | "big_bet" | "worth_doing" | "low_priority";
}

interface ReplaySynthesisResponse {
  friction_patterns: ReplayFriction[];
  impact_metrics: ReplayImpact[];
  effort_impact_matrix: ReplayMatrixItem[];
  key_takeaway: {
    title: string;
    detail: string;
  };
}

function buildReplayPrompt(formattedData: string): string {
  return `You are a UX research analyst synthesizing findings from session replay friction analyses.

Below is annotated data from multiple session replays including friction points, findings, recommendations, and open questions.

--- RAW DATA ---
${formattedData}
--- END DATA ---

Analyze the cross-replay patterns and respond with valid JSON in this exact structure:

{
  "friction_patterns": [
    {
      "pattern": "Short name of recurring friction pattern",
      "frequency": 3,
      "severity": "critical" | "high" | "medium" | "low"
    }
  ],
  "impact_metrics": [
    {
      "metric": "Name of affected metric",
      "mentions": 2,
      "severity": "critical" | "high" | "medium" | "low"
    }
  ],
  "effort_impact_matrix": [
    {
      "issue": "Issue name",
      "effort": "small" | "medium" | "large",
      "impact": "critical" | "high" | "medium" | "low",
      "quadrant": "quick_win" | "big_bet" | "worth_doing" | "low_priority"
    }
  ],
  "key_takeaway": {
    "title": "Single most important cross-cutting recommendation",
    "detail": "Why this matters and what to do about it"
  }
}

Rules:
- friction_patterns: Group similar friction points across replays, count how many sessions they appeared in
- impact_metrics: Which product metrics are mentioned most often as affected
- effort_impact_matrix: Classify every finding into one of the four quadrants based on effort and impact
- key_takeaway: The single most important insight a PM should act on
- Return ONLY valid JSON, no markdown wrapping`;
}

function replaySynthesisToRows(
  synthesis: ReplaySynthesisResponse,
  batchId: string
): Omit<ResearchInsightRow, "id" | "created_at">[] {
  const rows: Omit<ResearchInsightRow, "id" | "created_at">[] = [];

  for (const f of synthesis.friction_patterns) {
    rows.push({
      type: "replay_friction",
      title: f.pattern,
      body: null,
      mentions: f.frequency,
      tags: null,
      source_session_ids: null,
      metadata: { severity: f.severity },
      batch_id: batchId,
      session_id: null,
    });
  }

  for (const m of synthesis.impact_metrics) {
    rows.push({
      type: "replay_impact",
      title: m.metric,
      body: null,
      mentions: m.mentions,
      tags: null,
      source_session_ids: null,
      metadata: { severity: m.severity },
      batch_id: batchId,
      session_id: null,
    });
  }

  for (const item of synthesis.effort_impact_matrix) {
    rows.push({
      type: "replay_matrix",
      title: item.issue,
      body: null,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: {
        effort: item.effort,
        impact: item.impact,
        quadrant: item.quadrant,
      },
      batch_id: batchId,
      session_id: null,
    });
  }

  if (synthesis.key_takeaway) {
    rows.push({
      type: "replay_takeaway",
      title: synthesis.key_takeaway.title,
      body: synthesis.key_takeaway.detail,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: null,
      batch_id: batchId,
      session_id: null,
    });
  }

  return rows;
}

export async function POST() {
  const db = getSupabaseAdmin();

  const formattedData = formatReplaysForPrompt();
  const prompt = buildReplayPrompt(formattedData);

  let rawResponse: string;
  try {
    rawResponse = await generateSynthesisText(prompt);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Synthesis request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let synthesis: ReplaySynthesisResponse;
  try {
    synthesis = parseLLMJSON<ReplaySynthesisResponse>(rawResponse);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to parse synthesis response as JSON",
        raw: rawResponse.slice(0, 500),
      },
      { status: 502 }
    );
  }

  const batchId = crypto.randomUUID();
  const rows = replaySynthesisToRows(synthesis, batchId);

  const { error: insertErr } = await db
    .from("research_insights")
    .insert(rows);

  if (insertErr) {
    return NextResponse.json(
      { error: insertErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    batchId,
    model: getSynthesisModelName(),
    insightCount: rows.length,
  });
}
