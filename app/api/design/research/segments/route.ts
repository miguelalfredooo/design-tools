import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { SegmentRow } from "@/lib/research-hub-types";
import { segmentFromRow } from "@/lib/research-hub-types";

export async function GET() {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from("research_segments")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json((data as SegmentRow[]).map(segmentFromRow));
}

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { name, description } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("research_segments")
    .insert({ name, description: description || null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(segmentFromRow(data as SegmentRow));
}
