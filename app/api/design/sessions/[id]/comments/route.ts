import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { insertNotification } from "@/lib/notifications";
import { verifySessionToken } from "@/app/lib/session";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const { searchParams } = new URL(request.url);
  const optionId = searchParams.get("optionId");

  const db = getSupabaseAdmin();

  let query = db
    .from("design_comments")
    .select("*")
    .eq("session_id", sessionId)
    .not("x_pct", "is", null);

  if (optionId) {
    query = query.eq("option_id", optionId);
  }

  const { data: comments, error } = await query.order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: comments ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const { optionId, voterId, voterName, body: commentBody, xPct, yPct } = body;

  if (!optionId || !voterId || !voterName?.trim()) {
    return NextResponse.json(
      { error: "Missing optionId, voterId, or voterName" },
      { status: 400 }
    );
  }

  if (!commentBody?.trim() || commentBody.trim().length > 280) {
    return NextResponse.json(
      { error: "Comment body must be 1-280 characters" },
      { status: 400 }
    );
  }

  if (typeof xPct !== "number" || typeof yPct !== "number" || xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) {
    return NextResponse.json(
      { error: "xPct and yPct must be numbers between 0 and 100" },
      { status: 400 }
    );
  }

  const db = getSupabaseAdmin();

  // Verify session exists
  const { data: session } = await db
    .from("voting_sessions")
    .select("id")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Verify option belongs to session
  const { data: option } = await db
    .from("voting_options")
    .select("id")
    .eq("id", optionId)
    .eq("session_id", sessionId)
    .single();

  if (!option) {
    return NextResponse.json({ error: "Invalid option" }, { status: 400 });
  }

  const { data: comment, error } = await db
    .from("design_comments")
    .insert({
      session_id: sessionId,
      option_id: optionId,
      voter_id: voterId,
      voter_name: voterName.trim(),
      body: commentBody.trim(),
      x_pct: xPct,
      y_pct: yPct,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget notification
  const { data: sessionForNotif } = await db
    .from("voting_sessions")
    .select("title")
    .eq("id", sessionId)
    .single();

  if (sessionForNotif) {
    insertNotification({
      type: "comment_added",
      sessionId,
      sessionTitle: sessionForNotif.title,
      actorName: voterName.trim(),
      message: `${voterName.trim()} commented in "${sessionForNotif.title}"`,
      link: `/explorations/${sessionId}/options/${optionId}`,
    }).catch(() => {});
  }

  return NextResponse.json({ comment });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const { commentId, voterId, creatorToken, adminPassword } = body;

  if (!commentId) {
    return NextResponse.json({ error: "Missing commentId" }, { status: 400 });
  }

  // Check sessionToken first (preferred method)
  const sessionToken = extractSessionToken(request);
  const sessionValid = sessionToken ? verifySessionToken(sessionToken).valid : false;

  const db = getSupabaseAdmin();

  // Fetch comment to verify it belongs to this session
  const { data: comment } = await db
    .from("design_comments")
    .select("id, voter_id, session_id")
    .eq("id", commentId)
    .eq("session_id", sessionId)
    .single();

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Auth: commenter (matching voterId) OR creator/admin OR sessionToken valid
  const isOwner = voterId && comment.voter_id === voterId;

  let isCreator = false;
  if (creatorToken) {
    const { data: session } = await db
      .from("voting_sessions")
      .select("creator_token")
      .eq("id", sessionId)
      .single();
    isCreator = !!session && session.creator_token === creatorToken;
  }

  let isAdmin = false;
  if (adminPassword) {
    const expectedPassword = process.env.DESIGN_TOOLS_PASSWORD;
    isAdmin = !!expectedPassword && adminPassword === expectedPassword;
  }

  if (!isOwner && !isCreator && !isAdmin && !sessionValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { error } = await db
    .from("design_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
