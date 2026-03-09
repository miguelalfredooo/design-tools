import { supabase } from "@/lib/supabase";
import type { ResearchInsightRow } from "@/lib/research-types";
import { insightFromRow } from "@/lib/research-types";
import { ResearchClient } from "@/components/design/research-client";

async function getLatestBatch() {
  if (!supabase) return null;

  const { data: latest } = await supabase
    .from("research_insights")
    .select("batch_id, created_at")
    .is("session_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!latest) return null;

  const { data: rows } = await supabase
    .from("research_insights")
    .select("*")
    .eq("batch_id", latest.batch_id)
    .order("created_at", { ascending: true });

  if (!rows) return null;

  const insights = (rows as ResearchInsightRow[]).map(insightFromRow);
  return {
    batchId: latest.batch_id,
    createdAt: latest.created_at,
    insights,
  };
}

export default async function ResearchPage() {
  const batch = await getLatestBatch();
  return <ResearchClient batch={batch} />;
}
