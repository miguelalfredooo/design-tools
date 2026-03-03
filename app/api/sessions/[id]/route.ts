import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getSupabaseAdmin();

  const [sessionRes, optionsRes, voteCountRes] = await Promise.all([
    db.from("voting_sessions").select("*").eq("id", id).single(),
    db.from("voting_options").select("*").eq("session_id", id).order("position"),
    db.rpc("get_vote_count", { p_session_id: id }),
  ]);

  if (sessionRes.error || !sessionRes.data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Votes are only readable when phase = revealed (RLS enforced)
  // But we fetch via admin to return them when revealed
  let votes: unknown[] = [];
  if (sessionRes.data.phase === "revealed") {
    const votesRes = await db
      .from("voting_votes")
      .select("*")
      .eq("session_id", id)
      .order("created_at");
    votes = votesRes.data ?? [];
  }

  return NextResponse.json({
    session: sessionRes.data,
    options: optionsRes.data ?? [],
    votes,
    voteCount: voteCountRes.data ?? 0,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { creatorToken, phase, participantCount } = body;

  if (!creatorToken) {
    return NextResponse.json({ error: "Missing creatorToken" }, { status: 401 });
  }

  const db = getSupabaseAdmin();

  // Verify creator
  const { data: session } = await db
    .from("voting_sessions")
    .select("creator_token")
    .eq("id", id)
    .single();

  if (!session || session.creator_token !== creatorToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (phase) updates.phase = phase;
  if (participantCount !== undefined) updates.participant_count = Math.max(1, participantCount);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { error } = await db
    .from("voting_sessions")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If resetting to setup, clear votes
  if (phase === "setup") {
    await db.from("voting_votes").delete().eq("session_id", id);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { creatorToken } = body;

  if (!creatorToken) {
    return NextResponse.json({ error: "Missing creatorToken" }, { status: 401 });
  }

  const db = getSupabaseAdmin();

  // Verify creator
  const { data: session } = await db
    .from("voting_sessions")
    .select("creator_token")
    .eq("id", id)
    .single();

  if (!session || session.creator_token !== creatorToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Cascade delete handles options and votes
  const { error } = await db.from("voting_sessions").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
