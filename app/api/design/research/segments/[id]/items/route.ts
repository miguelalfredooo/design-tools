import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { SegmentItemRow } from "@/lib/research-hub-types";
import { segmentItemFromRow } from "@/lib/research-hub-types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from("research_segment_items")
    .select("*")
    .eq("segment_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data as SegmentItemRow[]).map(segmentItemFromRow)
  );
}
