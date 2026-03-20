import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { verifySessionToken } from "@/app/lib/session";
import { validateOptionInput } from "@/app/lib/input-validation";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const validation = validateOptionInput(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.errors },
      { status: 400 }
    );
  }
  const { title, description, mediaType, mediaUrl, creatorToken, adminPassword, rationale, suggested, suggestedBy } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  // Check sessionToken first (preferred method)
  const sessionToken = extractSessionToken(request);
  const sessionValid = sessionToken ? (await verifySessionToken(sessionToken)).valid : false;

  const db = getSupabaseAdmin();

  const { data: session } = await db
    .from("voting_sessions")
    .select("creator_token, phase")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isAdmin = sessionValid || isValidAdmin(adminPassword);
  const isCreator = isAdmin || (creatorToken && session.creator_token === creatorToken);
  const isSuggestion = suggested === true && suggestedBy;

  // Creator/admin can add during setup; participants can suggest during voting
  if (isCreator) {
    if (session.phase !== "setup") {
      return NextResponse.json({ error: "Can only add options during setup" }, { status: 400 });
    }
  } else if (isSuggestion) {
    if (session.phase !== "voting") {
      return NextResponse.json({ error: "Can only suggest options during voting" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Get current max position
  const { data: existing } = await db
    .from("voting_options")
    .select("position")
    .eq("session_id", sessionId)
    .order("position", { ascending: false })
    .limit(1);

  const nextPosition = (existing?.[0]?.position ?? -1) + 1;

  const { data: option, error } = await db
    .from("voting_options")
    .insert({
      session_id: sessionId,
      title: title.trim(),
      description: (description ?? "").trim(),
      media_type: mediaType ?? "none",
      media_url: mediaUrl?.trim() || null,
      position: nextPosition,
      rationale: rationale?.trim() || null,
      suggested: !!isSuggestion,
      suggested_by: isSuggestion ? suggestedBy.trim() : null,
    })
    .select()
    .single();

  if (error || !option) {
    return NextResponse.json({ error: error?.message ?? "Failed to add option" }, { status: 500 });
  }

  return NextResponse.json({ option });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const validation = validateOptionInput(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.errors },
      { status: 400 }
    );
  }
  const { optionId, creatorToken, adminPassword, title, description, mediaType, mediaUrl } = body;

  if (!optionId) {
    return NextResponse.json({ error: "Missing optionId" }, { status: 400 });
  }

  // Check sessionToken first (preferred method)
  const sessionToken = extractSessionToken(request);
  const sessionValid = sessionToken ? (await verifySessionToken(sessionToken)).valid : false;

  // Allow if: sessionToken valid OR (creatorToken OR adminPassword)
  if (!sessionValid && !creatorToken && !adminPassword) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const db = getSupabaseAdmin();

  const { data: session } = await db
    .from("voting_sessions")
    .select("creator_token, phase")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // If sessionToken valid, admin has full access; otherwise check creatorToken/adminPassword
  if (!sessionValid && !isValidAdmin(adminPassword) && session.creator_token !== creatorToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = (description ?? "").trim();
  if (mediaType !== undefined) updates.media_type = mediaType;
  if (mediaUrl !== undefined) updates.media_url = mediaUrl?.trim() || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { error } = await db
    .from("voting_options")
    .update(updates)
    .eq("id", optionId)
    .eq("session_id", sessionId);

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
  const { optionId, creatorToken, adminPassword } = body;

  if (!optionId) {
    return NextResponse.json({ error: "Missing optionId" }, { status: 400 });
  }

  // Check sessionToken first (preferred method)
  const sessionToken = extractSessionToken(request);
  const sessionValid = sessionToken ? (await verifySessionToken(sessionToken)).valid : false;

  // Allow if: sessionToken valid OR (creatorToken OR adminPassword)
  if (!sessionValid && !creatorToken && !adminPassword) {
    return NextResponse.json({ error: "Missing authorization" }, { status: 401 });
  }

  const db = getSupabaseAdmin();

  // Verify authorization
  const { data: session } = await db
    .from("voting_sessions")
    .select("creator_token, phase")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // If sessionToken valid, admin has full access; otherwise check creatorToken/adminPassword
  if (!sessionValid && !isValidAdmin(adminPassword) && session.creator_token !== creatorToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Creator can delete during setup, or delete suggested options during voting
  if (session.phase !== "setup" && session.phase !== "voting") {
    return NextResponse.json({ error: "Cannot remove options in this phase" }, { status: 400 });
  }

  const { error } = await db
    .from("voting_options")
    .delete()
    .eq("id", optionId)
    .eq("session_id", sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
