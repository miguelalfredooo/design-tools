import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from("design_comments")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const { optionId, voterId, voterName, body: commentBody } = body;

  if (!optionId || !voterId || !voterName?.trim() || !commentBody?.trim()) {
    return NextResponse.json(
      { error: "Missing optionId, voterId, voterName, or body" },
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

  const { data: comment, error } = await db
    .from("design_comments")
    .insert({
      session_id: sessionId,
      option_id: optionId,
      voter_id: voterId,
      voter_name: voterName.trim(),
      body: commentBody.trim(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comment });
}
