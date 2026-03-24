import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  generateSynthesisText,
  getSynthesisModelName,
  parseLLMJSON,
} from "@/lib/synthesis-llm";
import type {
  SessionSynthesisResponse,
  ResearchInsightRow,
} from "@/lib/research-types";
import type {
  VotingSessionRow,
  VotingOptionRow,
  VotingVoteRow,
  DesignCommentRow,
} from "@/lib/design-types";

function formatSessionForPrompt(
  session: VotingSessionRow,
  options: VotingOptionRow[],
  votes: VotingVoteRow[],
  comments: DesignCommentRow[]
): string {
  const optionLines = options
    .map((o) => {
      const optVotes = votes.filter((v) => v.option_id === o.id);
      const optComments = comments.filter((c) => c.option_id === o.id);
      const voteLines = optVotes
        .filter((v) => v.comment)
        .map(
          (v) =>
            `    - ${v.voter_name}: "${v.comment}" (effort: ${v.effort || "n/a"}, impact: ${v.impact || "n/a"})`
        );
      const commentLines = optComments.map(
        (c) => `    - ${c.voter_name} [at ${Math.round(c.x_pct ?? 0)}%,${Math.round(c.y_pct ?? 0)}%]: "${c.body}"`
      );
      return [
        `Option: "${o.title}"`,
        o.description ? `  Description: ${o.description}` : null,
        o.rationale ? `  Rationale: ${o.rationale}` : null,
        `  Votes: ${optVotes.length}`,
        voteLines.length > 0
          ? `  Vote comments:\n${voteLines.join("\n")}`
          : null,
        commentLines.length > 0
          ? `  Spatial comments:\n${commentLines.join("\n")}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return [
    `SESSION: "${session.title}"`,
    session.description ? `Description: ${session.description}` : null,
    session.problem ? `Problem: ${session.problem}` : null,
    session.goal ? `Goal: ${session.goal}` : null,
    session.audience ? `Audience: ${session.audience}` : null,
    session.constraints ? `Constraints: ${session.constraints}` : null,
    `Total votes: ${votes.length}`,
    `\nOptions & Feedback:`,
    optionLines,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSessionPrompt(formattedData: string): string {
  return `You are a synthesis analyst helping a product designer understand the results of a single design exploration session.

Below is the full data from one session including all options, votes, vote comments, and spatial comments pinned to specific locations on the designs.

--- RAW DATA ---
${formattedData}
--- END DATA ---

Analyze this session and respond with valid JSON in this exact structure:

{
  "recommendation": {
    "option_title": "The option you recommend picking",
    "rationale": "2-3 sentences explaining why, based on voter feedback and comment patterns"
  },
  "sentiments": [
    {
      "option_title": "Option name",
      "summary": "1-2 sentences summarizing how voters felt about this option",
      "tone": "positive" | "mixed" | "negative"
    }
  ],
  "comment_themes": [
    {
      "title": "Short theme name",
      "detail": "What voters are saying about this theme"
    }
  ],
  "consensus": ["Where voters agree..."],
  "tensions": ["Where voters disagree..."],
  "next_steps": ["Suggested follow-up actions based on the feedback..."]
}

Rules:
- Include a sentiment entry for EVERY option
- Ground analysis in actual voter comments — don't invent feedback
- If there aren't enough comments to draw conclusions, say so
- Keep language concise and actionable
- Return ONLY valid JSON, no markdown wrapping`;
}

function sessionSynthesisToRows(
  synthesis: SessionSynthesisResponse,
  batchId: string,
  sessionId: string
): Omit<ResearchInsightRow, "id" | "created_at">[] {
  const rows: Omit<ResearchInsightRow, "id" | "created_at">[] = [];

  rows.push({
    type: "recommendation",
    title: synthesis.recommendation.option_title,
    body: synthesis.recommendation.rationale,
    mentions: null,
    tags: null,
    source_session_ids: [sessionId],
    metadata: null,
    batch_id: batchId,
    session_id: sessionId,
  });

  for (const s of synthesis.sentiments) {
    rows.push({
      type: "sentiment",
      title: s.option_title,
      body: s.summary,
      mentions: null,
      tags: null,
      source_session_ids: [sessionId],
      metadata: { tone: s.tone },
      batch_id: batchId,
      session_id: sessionId,
    });
  }

  for (const theme of synthesis.comment_themes) {
    rows.push({
      type: "comment_theme",
      title: theme.title,
      body: theme.detail,
      mentions: null,
      tags: null,
      source_session_ids: [sessionId],
      metadata: null,
      batch_id: batchId,
      session_id: sessionId,
    });
  }

  for (const item of synthesis.consensus) {
    rows.push({
      type: "consensus",
      title: null,
      body: item,
      mentions: null,
      tags: null,
      source_session_ids: [sessionId],
      metadata: null,
      batch_id: batchId,
      session_id: sessionId,
    });
  }

  for (const item of synthesis.tensions) {
    rows.push({
      type: "tension",
      title: null,
      body: item,
      mentions: null,
      tags: null,
      source_session_ids: [sessionId],
      metadata: null,
      batch_id: batchId,
      session_id: sessionId,
    });
  }

  for (const step of synthesis.next_steps) {
    rows.push({
      type: "next_step",
      title: null,
      body: step,
      mentions: null,
      tags: null,
      source_session_ids: [sessionId],
      metadata: null,
      batch_id: batchId,
      session_id: sessionId,
    });
  }

  return rows;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getSupabaseAdmin();

  // Fetch session + related data
  const [sessionRes, optionsRes, votesRes, commentsRes] = await Promise.all([
    db.from("voting_sessions").select("*").eq("id", id).single(),
    db.from("voting_options").select("*").eq("session_id", id),
    db.from("voting_votes").select("*").eq("session_id", id),
    db.from("design_comments").select("*").eq("session_id", id),
  ]);

  if (sessionRes.error || !sessionRes.data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = sessionRes.data as VotingSessionRow;
  const options = (optionsRes.data ?? []) as VotingOptionRow[];
  const votes = (votesRes.data ?? []) as VotingVoteRow[];
  const comments = (commentsRes.data ?? []) as DesignCommentRow[];

  // Build prompt
  const formattedData = formatSessionForPrompt(session, options, votes, comments);
  const prompt = buildSessionPrompt(formattedData);

  // Call configured synthesis provider
  let rawResponse: string;
  try {
    rawResponse = await generateSynthesisText(prompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Synthesis request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Parse JSON
  let synthesis: SessionSynthesisResponse;
  try {
    synthesis = parseLLMJSON<SessionSynthesisResponse>(rawResponse);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to parse synthesis response as JSON",
        raw: rawResponse.slice(0, 500),
      },
      { status: 502 }
    );
  }

  // Store insights
  const batchId = crypto.randomUUID();
  const rows = sessionSynthesisToRows(synthesis, batchId, id);

  const { error: insertErr } = await db
    .from("research_insights")
    .insert(rows);

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({
    batchId,
    model: getSynthesisModelName(),
    insightCount: rows.length,
  });
}
