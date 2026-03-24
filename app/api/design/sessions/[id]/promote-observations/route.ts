import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { VotingSessionRow, VotingVoteRow, VotingOptionRow } from "@/lib/design-types";

interface DesignCommentRow {
  id: string;
  session_id: string;
  option_id: string | null;
  voter_name: string;
  body: string;
  x_pct: number | null;
  y_pct: number | null;
  created_at: string;
}

// Area = explicit topic tag if set, else session title
function inferArea(session: VotingSessionRow): string {
  return session.topic ?? session.title;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getSupabaseAdmin();

  // Check if already promoted
  const { count } = await db
    .from("research_observations")
    .select("id", { count: "exact", head: true })
    .eq("source_url", `/explorations/${id}`);

  return NextResponse.json({ promoted: (count ?? 0) > 0, count: count ?? 0 });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getSupabaseAdmin();

  // Fetch everything we need
  const [sessionRes, optionsRes, votesRes, commentsRes, insightsRes] = await Promise.all([
    db.from("voting_sessions").select("*").eq("id", id).single(),
    db.from("voting_options").select("*").eq("session_id", id),
    db.from("voting_votes").select("*").eq("session_id", id),
    db.from("design_comments").select("*").eq("session_id", id),
    db.from("research_insights").select("type,title,body").eq("session_id", id),
  ]);

  if (sessionRes.error || !sessionRes.data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const session = sessionRes.data as VotingSessionRow;
  const options = (optionsRes.data ?? []) as VotingOptionRow[];
  const votes = (votesRes.data ?? []) as VotingVoteRow[];
  const comments = (commentsRes.data ?? []) as DesignCommentRow[];
  const insights = (insightsRes.data ?? []) as { type: string; title: string | null; body: string | null }[];

  // Dedup guard — don't promote the same session twice
  const { count: existing } = await db
    .from("research_observations")
    .select("id", { count: "exact", head: true })
    .eq("source_url", `/explorations/${id}`);

  if ((existing ?? 0) > 0) {
    return NextResponse.json(
      { error: "This session has already been sent to the Research Hub." },
      { status: 409 }
    );
  }

  const optionsByID = Object.fromEntries(options.map((o) => [o.id, o]));
  const area = inferArea(session);
  const sourceUrl = `/explorations/${id}`;

  const rows: { body: string; area: string; contributor: string; source_url: string }[] = [];

  // 0. Designer hypothesis — explicit belief to confirm or contradict
  if (session.hypothesis?.trim()) {
    rows.push({
      body: `Designer hypothesis: ${session.hypothesis.trim()}`,
      area,
      contributor: "designer",
      source_url: sourceUrl,
    });
  }

  // 1. Vote comments — richest signal
  for (const vote of votes) {
    if (!vote.comment?.trim()) continue;
    const option = optionsByID[vote.option_id];
    const optionLabel = option ? ` (re: ${option.title})` : "";
    rows.push({
      body: `${vote.comment.trim()}${optionLabel}`,
      area,
      contributor: vote.voter_name,
      source_url: sourceUrl,
    });
  }

  // 2. Spatial comments — design-pinned feedback
  for (const comment of comments) {
    if (!comment.body?.trim()) continue;
    const option = comment.option_id ? optionsByID[comment.option_id] : null;
    const optionLabel = option ? ` (re: ${option.title})` : "";
    rows.push({
      body: `${comment.body.trim()}${optionLabel}`,
      area,
      contributor: comment.voter_name,
      source_url: sourceUrl,
    });
  }

  // 3. Synthesis insights — comment themes, consensus, tensions
  for (const insight of insights) {
    if (!insight.body?.trim()) continue;
    if (!["comment_theme", "consensus", "tension"].includes(insight.type)) continue;
    const prefix = insight.title ? `${insight.title}: ` : "";
    rows.push({
      body: `${prefix}${insight.body.trim()}`,
      area,
      contributor: "synthesis",
      source_url: sourceUrl,
    });
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No observations to promote — add vote comments or spatial comments first." },
      { status: 422 }
    );
  }

  const { error: insertErr } = await db.from("research_observations").insert(rows);

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ promoted: rows.length });
}
