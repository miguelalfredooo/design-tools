import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const { title, description, mediaType, mediaUrl, creatorToken, rationale } = body;

  if (!title?.trim() || !creatorToken) {
    return NextResponse.json({ error: "Missing title or creatorToken" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Verify creator
  const { data: session } = await db
    .from("voting_sessions")
    .select("creator_token, phase")
    .eq("id", sessionId)
    .single();

  if (!session || session.creator_token !== creatorToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (session.phase !== "setup") {
    return NextResponse.json({ error: "Can only add options during setup" }, { status: 400 });
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
    })
    .select()
    .single();

  if (error || !option) {
    return NextResponse.json({ error: error?.message ?? "Failed to add option" }, { status: 500 });
  }

  return NextResponse.json({ option });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const { optionId, creatorToken } = body;

  if (!optionId || !creatorToken) {
    return NextResponse.json({ error: "Missing optionId or creatorToken" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Verify creator
  const { data: session } = await db
    .from("voting_sessions")
    .select("creator_token, phase")
    .eq("id", sessionId)
    .single();

  if (!session || session.creator_token !== creatorToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (session.phase !== "setup") {
    return NextResponse.json({ error: "Can only remove options during setup" }, { status: 400 });
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
