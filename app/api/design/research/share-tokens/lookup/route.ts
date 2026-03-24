import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

// GET /api/design/research/share-tokens/lookup?token=abc123
// Returns the token row including context. Used by the contribute page.
export async function GET(req: NextRequest) {
  const db = getSupabaseAdmin();
  const token = new URL(req.url).searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("research_share_tokens")
    .select("id, token, context, expires_at, created_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 410 });
  }

  // Total observation count in the hub (useful context for contributors)
  const { count } = await db
    .from("research_observations")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({ ...data, observationCount: count ?? 0 });
}
