import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/design/research/directions/votes
// Returns all votes grouped by direction_id
export async function GET() {
  const { data, error } = await supabase
    .from("direction_votes")
    .select("id, direction_id, voter_name, reason, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// POST /api/design/research/directions/votes
// Body: { direction_id, voter_name, reason? }
// Toggles: if vote exists for (direction_id, voter_name) → delete it; else insert
export async function POST(req: Request) {
  const body = await req.json();
  const { direction_id, voter_name, reason } = body;

  if (!direction_id || !voter_name) {
    return NextResponse.json(
      { error: "direction_id and voter_name are required" },
      { status: 400 }
    );
  }

  // Check if vote already exists
  const { data: existing } = await supabase
    .from("direction_votes")
    .select("id")
    .eq("direction_id", direction_id)
    .eq("voter_name", voter_name)
    .maybeSingle();

  if (existing) {
    // Remove vote
    const { error } = await supabase
      .from("direction_votes")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ voted: false });
  }

  // Cast vote
  const { error } = await supabase.from("direction_votes").insert({
    direction_id,
    voter_name,
    reason: reason || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ voted: true });
}
