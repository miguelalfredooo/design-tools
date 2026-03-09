import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const db = getSupabaseAdmin();

  const { data: reactions, error } = await db
    .from("design_reactions")
    .select("*")
    .eq("session_id", sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reactions: reactions ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  const body = await request.json();
  const { optionId, voterId } = body;

  if (!optionId || !voterId) {
    return NextResponse.json({ error: "Missing optionId or voterId" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Check if reaction already exists
  const { data: existing } = await db
    .from("design_reactions")
    .select("id")
    .eq("session_id", sessionId)
    .eq("option_id", optionId)
    .eq("voter_id", voterId)
    .maybeSingle();

  if (existing) {
    // Remove reaction (toggle off)
    await db.from("design_reactions").delete().eq("id", existing.id);
    return NextResponse.json({ toggled: "removed" });
  }

  // Add reaction (toggle on) — handle duplicate from rapid clicks gracefully
  const { error } = await db.from("design_reactions").insert({
    session_id: sessionId,
    option_id: optionId,
    voter_id: voterId,
  });

  if (error) {
    // Unique constraint violation means a concurrent request already added it
    if (error.code === "23505") {
      return NextResponse.json({ toggled: "added" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ toggled: "added" });
}
