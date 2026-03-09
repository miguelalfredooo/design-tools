import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { ResearchInsightRow } from "@/lib/research-types";

export async function GET() {
  const db = getSupabaseAdmin();

  // Find the latest replay batch (types start with replay_)
  const { data: latest } = await db
    .from("research_insights")
    .select("batch_id, created_at")
    .like("type", "replay_%")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!latest) {
    return NextResponse.json(null);
  }

  const { data: rows } = await db
    .from("research_insights")
    .select("*")
    .eq("batch_id", latest.batch_id)
    .order("created_at", { ascending: true });

  if (!rows || rows.length === 0) {
    return NextResponse.json(null);
  }

  const typedRows = rows as ResearchInsightRow[];

  const frictions = typedRows
    .filter((r) => r.type === "replay_friction")
    .map((r) => ({
      pattern: r.title ?? "",
      frequency: r.mentions ?? 0,
      severity: (r.metadata as Record<string, string>)?.severity ?? "medium",
    }))
    .sort((a, b) => b.frequency - a.frequency);

  const matrix = typedRows
    .filter((r) => r.type === "replay_matrix")
    .map((r) => {
      const meta = r.metadata as Record<string, string>;
      return {
        issue: r.title ?? "",
        effort: meta?.effort ?? "medium",
        impact: meta?.impact ?? "medium",
        quadrant: meta?.quadrant ?? "worth_doing",
      };
    });

  const takeawayRow = typedRows.find((r) => r.type === "replay_takeaway");
  const takeaway = takeawayRow
    ? { title: takeawayRow.title ?? "", detail: takeawayRow.body ?? "" }
    : null;

  return NextResponse.json({ frictions, matrix, takeaway });
}
