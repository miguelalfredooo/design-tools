import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  generateSynthesisText,
  getSynthesisModelName,
  parseLLMJSON,
} from "@/lib/synthesis-llm";
import type {
  OllamaSynthesisResponse,
  ResearchInsightRow,
} from "@/lib/research-types";
import type {
  VotingSessionRow,
  VotingOptionRow,
  VotingVoteRow,
  DesignCommentRow,
} from "@/lib/design-types";

function formatSessionData(
  sessions: VotingSessionRow[],
  options: VotingOptionRow[],
  votes: VotingVoteRow[],
  comments: DesignCommentRow[]
): string {
  return sessions
    .map((s) => {
      const sOpts = options.filter((o) => o.session_id === s.id);
      const sVotes = votes.filter((v) => v.session_id === s.id);
      const sComments = comments.filter((c) => c.session_id === s.id);

      const optionLines = sOpts
        .map((o) => {
          const optVotes = sVotes.filter((v) => v.option_id === o.id);
          const optComments = sComments.filter((c) => c.option_id === o.id);
          const voteLines = optVotes
            .filter((v) => v.comment)
            .map(
              (v) =>
                `    - ${v.voter_name}: "${v.comment}" (effort: ${v.effort || "n/a"}, impact: ${v.impact || "n/a"})`
            );
          const commentLines = optComments.map(
            (c) => `    - ${c.voter_name}: "${c.body}"`
          );
          return [
            `  Option: "${o.title}" — ${o.description}${o.rationale ? ` (rationale: ${o.rationale})` : ""}`,
            `  Votes: ${optVotes.length}`,
            voteLines.length > 0
              ? `  Vote comments:\n${voteLines.join("\n")}`
              : null,
            commentLines.length > 0
              ? `  Discussion:\n${commentLines.join("\n")}`
              : null,
          ]
            .filter(Boolean)
            .join("\n");
        })
        .join("\n\n");

      return [
        `SESSION: "${s.title}"`,
        s.description ? `Description: ${s.description}` : null,
        s.problem ? `Problem: ${s.problem}` : null,
        s.goal ? `Goal: ${s.goal}` : null,
        s.audience ? `Audience: ${s.audience}` : null,
        s.constraints ? `Constraints: ${s.constraints}` : null,
        `Phase: ${s.phase}`,
        `\nOptions & Feedback:`,
        optionLines,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

function buildPrompt(formattedData: string, sessionCount: number): string {
  return `You are a synthesis analyst helping a product designer extract strategic insights from design exploration sessions.

Below is raw data from ${sessionCount} design sessions including vote comments, feedback, and session context.

--- RAW DATA ---
${formattedData}
--- END DATA ---

Analyze this content and respond with valid JSON in this exact structure:

{
  "themes": [
    {
      "title": "Short descriptive name",
      "summary": "What the data is saying",
      "sources": ["Session: X - voter Y said...", ...],
      "mentions": 0,
      "confidence": "validated" | "assumed" | "speculative"
    }
  ],
  "opportunities": [
    {
      "theme": "Theme title it relates to",
      "hmw": "How might we...",
      "confidence": "validated" | "assumed" | "speculative"
    }
  ],
  "consensus": ["Where multiple sources agree..."],
  "tensions": ["Where sources contradict..."],
  "open_questions": ["What the data leaves unanswered..."],
  "signals": [
    {
      "title": "Surprising finding",
      "detail": "Why it matters"
    }
  ],
  "one_metric": {
    "metric": "The single behavior/outcome to improve",
    "rationale": "Why this has the highest downstream impact"
  }
}

Rules:
- Ground synthesis in what the data actually says
- Flag inferences vs. direct findings explicitly
- Use plain language suitable for stakeholder briefs
- Never fabricate supporting evidence - if something is thin, say so
- Respond with 3-6 themes
- Return ONLY valid JSON, no markdown wrapping`;
}

function synthesisToRows(
  synthesis: OllamaSynthesisResponse,
  batchId: string,
  sessionIds: string[]
): Omit<ResearchInsightRow, "id" | "created_at">[] {
  const rows: Omit<ResearchInsightRow, "id" | "created_at">[] = [];

  for (const theme of synthesis.themes) {
    rows.push({
      type: "theme",
      title: theme.title,
      body: theme.summary,
      mentions: theme.mentions,
      tags: null,
      source_session_ids: sessionIds,
      metadata: {
        confidence: theme.confidence,
        sources: theme.sources,
      },
      batch_id: batchId,
      session_id: null,
    });
  }

  for (const opp of synthesis.opportunities) {
    rows.push({
      type: "opportunity",
      title: opp.hmw,
      body: null,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: { confidence: opp.confidence, theme: opp.theme },
      batch_id: batchId,
      session_id: null,
    });
  }

  for (const item of synthesis.consensus) {
    rows.push({
      type: "consensus",
      title: null,
      body: item,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: null,
      batch_id: batchId,
      session_id: null,
    });
  }

  for (const item of synthesis.tensions) {
    rows.push({
      type: "tension",
      title: null,
      body: item,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: null,
      batch_id: batchId,
      session_id: null,
    });
  }

  for (const item of synthesis.open_questions) {
    rows.push({
      type: "open_question",
      title: null,
      body: item,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: null,
      batch_id: batchId,
      session_id: null,
    });
  }

  for (const signal of synthesis.signals) {
    rows.push({
      type: "signal",
      title: signal.title,
      body: signal.detail,
      mentions: null,
      tags: null,
      source_session_ids: null,
      metadata: null,
      batch_id: batchId,
      session_id: null,
    });
  }

  if (synthesis.one_metric) {
    rows.push({
      type: "one_metric",
      title: synthesis.one_metric.metric,
      body: synthesis.one_metric.rationale,
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

  // Step 1: Fetch all session data
  const [sessionsRes, optionsRes, votesRes, commentsRes] = await Promise.all([
    db.from("voting_sessions").select("*"),
    db.from("voting_options").select("*"),
    db.from("voting_votes").select("*"),
    db.from("design_comments").select("*"),
  ]);

  if (sessionsRes.error) {
    return NextResponse.json(
      { error: sessionsRes.error.message },
      { status: 500 }
    );
  }

  const sessions = sessionsRes.data as VotingSessionRow[];
  const options = (optionsRes.data ?? []) as VotingOptionRow[];
  const votes = (votesRes.data ?? []) as VotingVoteRow[];
  const comments = (commentsRes.data ?? []) as DesignCommentRow[];

  if (sessions.length === 0) {
    return NextResponse.json(
      { error: "No sessions found to synthesize" },
      { status: 400 }
    );
  }

  // Step 2: Build prompt
  const formattedData = formatSessionData(sessions, options, votes, comments);
  const prompt = buildPrompt(formattedData, sessions.length);

  // Step 3: Call configured synthesis provider
  let rawResponse: string;
  try {
    rawResponse = await generateSynthesisText(prompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Synthesis request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Step 4: Parse JSON
  let synthesis: OllamaSynthesisResponse;
  try {
    synthesis = parseLLMJSON<OllamaSynthesisResponse>(rawResponse);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to parse synthesis response as JSON",
        raw: rawResponse.slice(0, 500),
      },
      { status: 502 }
    );
  }

  // Step 5: Write to Supabase
  const batchId = crypto.randomUUID();
  const sessionIds = sessions.map((s) => s.id);
  const rows = synthesisToRows(synthesis, batchId, sessionIds);

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
    sessionCount: sessions.length,
  });
}
