import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { verifySessionToken } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getSupabaseAdmin();

  const [sessionRes, optionsRes, allVotesRes] = await Promise.all([
    db.from("voting_sessions").select("*").eq("id", id).single(),
    db.from("voting_options").select("*").eq("session_id", id).order("position"),
    db.from("voting_votes").select("session_id, voter_token").eq("session_id", id),
  ]);

  if (sessionRes.error || !sessionRes.data) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Count distinct voters
  const allVotes = allVotesRes.data ?? [];
  const distinctVoters = new Set(allVotes.map((v) => v.voter_token));
  const voteCount = distinctVoters.size;

  // During revealed phase, return all votes
  // During voting phase, return only the requesting voter's vote (for undo)
  let votes: unknown[] = [];
  if (sessionRes.data.phase === "revealed") {
    const votesRes = await db
      .from("voting_votes")
      .select("*")
      .eq("session_id", id)
      .order("created_at");
    votes = votesRes.data ?? [];
  } else if (sessionRes.data.phase === "voting") {
    const url = new URL(_request.url);
    const voterId = url.searchParams.get("voterId");
    if (voterId) {
      const votesRes = await db
        .from("voting_votes")
        .select("*")
        .eq("session_id", id)
        .eq("voter_id", voterId);
      votes = votesRes.data ?? [];
    }
  }

  return NextResponse.json({
    session: sessionRes.data,
    options: optionsRes.data ?? [],
    votes,
    voteCount,
  });
}

function isValidAdmin(adminPassword: string | undefined): boolean {
  const correct = process.env.DESIGN_TOOLS_PASSWORD;
  return !!correct && !!adminPassword && adminPassword === correct;
}

function extractSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith("sessionToken=")) {
      return trimmed.substring("sessionToken=".length);
    }
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { creatorToken, adminPassword, phase, participantCount } = body;

  // Check sessionToken first (preferred method)
  const sessionToken = extractSessionToken(request);
  const sessionValid = sessionToken ? verifySessionToken(sessionToken).valid : false;

  // Allow if: sessionToken valid OR (creatorToken OR adminPassword)
  if (!sessionValid && !creatorToken && !adminPassword) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const db = getSupabaseAdmin();

  // If sessionToken valid, admin has full access; otherwise check creatorToken/adminPassword
  if (!sessionValid) {
    if (!isValidAdmin(adminPassword)) {
      const { data: session } = await db
        .from("voting_sessions")
        .select("creator_token")
        .eq("id", id)
        .single();

      if (!session || session.creator_token !== creatorToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
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
  const { creatorToken, adminPassword } = body;

  // Check sessionToken first (preferred method)
  const sessionToken = extractSessionToken(request);
  const sessionValid = sessionToken ? verifySessionToken(sessionToken).valid : false;

  // Allow if: sessionToken valid OR (creatorToken OR adminPassword)
  if (!sessionValid && !creatorToken && !adminPassword) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const db = getSupabaseAdmin();

  // If sessionToken valid, admin has full access; otherwise check creatorToken/adminPassword
  if (!sessionValid) {
    if (!isValidAdmin(adminPassword)) {
      const { data: session } = await db
        .from("voting_sessions")
        .select("creator_token")
        .eq("id", id)
        .single();

      if (!session || session.creator_token !== creatorToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }
  }

  // Cascade delete handles options and votes
  const { error } = await db.from("voting_sessions").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
