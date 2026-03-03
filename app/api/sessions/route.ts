import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, participantCount, options, previewUrl, creatorToken, problem, goal, audience, constraints } = body;

  if (!title?.trim() || !creatorToken) {
    return NextResponse.json({ error: "Missing title or creatorToken" }, { status: 400 });
  }
  if (!Array.isArray(options) || options.filter((o: { title?: string }) => o.title?.trim()).length < 2) {
    return NextResponse.json({ error: "At least 2 options required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Create session
  const { data: session, error: sessionErr } = await db
    .from("voting_sessions")
    .insert({
      title: title.trim(),
      description: (description ?? "").trim(),
      preview_url: previewUrl?.trim() || null,
      problem: problem?.trim() || null,
      goal: goal?.trim() || null,
      audience: audience?.trim() || null,
      constraints: constraints?.trim() || null,
      participant_count: Math.max(1, participantCount ?? 1),
      creator_token: creatorToken,
    })
    .select()
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: sessionErr?.message ?? "Failed to create session" }, { status: 500 });
  }

  // Create options
  const optionRows = options
    .filter((o: { title?: string }) => o.title?.trim())
    .map((o: { title: string; description?: string; mediaType?: string; mediaUrl?: string; rationale?: string }, i: number) => ({
      session_id: session.id,
      title: o.title.trim(),
      description: (o.description ?? "").trim(),
      media_type: o.mediaType ?? "none",
      media_url: o.mediaUrl?.trim() || null,
      position: i,
      rationale: o.rationale?.trim() || null,
    }));

  const { error: optionsErr } = await db.from("voting_options").insert(optionRows);

  if (optionsErr) {
    // Cleanup session on option insert failure
    await db.from("voting_sessions").delete().eq("id", session.id);
    return NextResponse.json({ error: optionsErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: session.id, creatorToken });
}
