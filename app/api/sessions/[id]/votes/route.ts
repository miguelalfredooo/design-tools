import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const { optionId, voterId, voterName, comment, effort, impact } = body;

  if (!optionId || !voterId || !voterName?.trim()) {
    return NextResponse.json(
      { error: "Missing optionId, voterId, or voterName" },
      { status: 400 }
    );
  }

  const db = getSupabaseAdmin();

  // Check session exists and is in voting phase
  const { data: session } = await db
    .from("voting_sessions")
    .select("phase, participant_count")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.phase !== "voting") {
    return NextResponse.json(
      { error: "Session is not accepting votes" },
      { status: 400 }
    );
  }

  // Verify option belongs to this session
  const { data: option } = await db
    .from("voting_options")
    .select("id")
    .eq("id", optionId)
    .eq("session_id", sessionId)
    .single();

  if (!option) {
    return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  }

  // Insert vote (unique constraint on session_id + voter_id handles duplicates)
  const { error: voteErr } = await db.from("voting_votes").insert({
    session_id: sessionId,
    option_id: optionId,
    voter_id: voterId,
    voter_name: voterName.trim(),
    comment: comment?.trim() || null,
    effort: effort || null,
    impact: impact || null,
  });

  if (voteErr) {
    if (voteErr.code === "23505") {
      return NextResponse.json(
        { error: "You have already voted in this session" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: voteErr.message }, { status: 500 });
  }

  // Check if we should auto-reveal
  const { data: voteCount } = await db.rpc("get_vote_count", {
    p_session_id: sessionId,
  });

  if (voteCount >= session.participant_count) {
    await db
      .from("voting_sessions")
      .update({ phase: "revealed" })
      .eq("id", sessionId);
  }

  return NextResponse.json({ ok: true });
}
