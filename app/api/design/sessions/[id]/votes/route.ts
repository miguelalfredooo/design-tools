import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { insertNotification } from "@/lib/notifications";
import { verifySessionToken } from "@/app/lib/session";
import { validateVoteInput } from "@/app/lib/input-validation";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const validation = validateVoteInput(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.errors },
      { status: 400 }
    );
  }
  const { optionId, voterId, voterName, comment } = body;

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
    ...(comment?.trim() ? { comment: comment.trim() } : {}),
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

  // Fire-and-forget notification
  // Fetch session title for the notification message
  const { data: sessionForNotif } = await db
    .from("voting_sessions")
    .select("title")
    .eq("id", sessionId)
    .single();

  if (sessionForNotif) {
    insertNotification({
      type: "vote_cast",
      sessionId,
      sessionTitle: sessionForNotif.title,
      actorName: voterName.trim(),
      message: `${voterName.trim()} voted in "${sessionForNotif.title}"`,
      link: `/explorations/${sessionId}/options/${optionId}`,
    }).catch((err) => {
      console.error('[Notification Error] Failed to create vote notification:', err);
    });
  }

  // Check if we should auto-reveal
  const { data: allVotes } = await db
    .from("voting_votes")
    .select("voter_id")
    .eq("session_id", sessionId);

  const distinctVoters = new Set((allVotes ?? []).map((v) => v.voter_id));
  const voteCount = distinctVoters.size;

  if (voteCount >= session.participant_count && session.phase === "voting") {
    await db
      .from("voting_sessions")
      .update({ phase: "revealed" })
      .eq("id", sessionId)
      .eq("phase", "voting");
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const { voteId, pinned, creatorToken, adminPassword } = body;

  if (!voteId || typeof pinned !== "boolean") {
    return NextResponse.json(
      { error: "Missing voteId or pinned" },
      { status: 400 }
    );
  }

  // Check sessionToken first (preferred method)
  const sessionToken = extractSessionToken(request);
  const sessionValid = sessionToken ? (await verifySessionToken(sessionToken)).valid : false;

  const db = getSupabaseAdmin();

  // Verify session exists
  const { data: session } = await db
    .from("voting_sessions")
    .select("creator_token")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Auth: sessionToken valid OR must be creator or admin
  const isCreator = creatorToken && session.creator_token === creatorToken;
  let isAdmin = false;
  if (adminPassword) {
    const expectedPassword = process.env.DESIGN_TOOLS_PASSWORD;
    isAdmin = !!expectedPassword && adminPassword === expectedPassword;
  }

  if (!sessionValid && !isCreator && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Verify vote belongs to this session
  const { data: vote } = await db
    .from("voting_votes")
    .select("id")
    .eq("id", voteId)
    .eq("session_id", sessionId)
    .single();

  if (!vote) {
    return NextResponse.json({ error: "Vote not found" }, { status: 404 });
  }

  const { error } = await db
    .from("voting_votes")
    .update({ pinned })
    .eq("id", voteId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const { voterId } = body;

  if (!voterId) {
    return NextResponse.json({ error: "Missing voterId" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  const { data: session } = await db
    .from("voting_sessions")
    .select("phase")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.phase !== "voting") {
    return NextResponse.json({ error: "Cannot undo vote in this phase" }, { status: 400 });
  }

  const { error } = await db
    .from("voting_votes")
    .delete()
    .eq("session_id", sessionId)
    .eq("voter_id", voterId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
