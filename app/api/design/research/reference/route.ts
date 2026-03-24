import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { ObservationRow, SegmentRow, SegmentItemRow, Bucket } from "@/lib/research-hub-types";

export async function GET() {
  const db = getSupabaseAdmin();

  const [obsRes, segRes, itemsRes] = await Promise.all([
    db
      .from("research_observations")
      .select("id, area, body, contributor, source_url, created_at")
      .order("created_at", { ascending: false }),
    db
      .from("research_segments")
      .select("id, name")
      .order("created_at", { ascending: true }),
    db
      .from("research_segment_items")
      .select("id, segment_id, bucket, title, body, source_observation_ids, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const observations = (obsRes.data ?? []) as ObservationRow[];
  const segments = (segRes.data ?? []) as Pick<SegmentRow, "id" | "name">[];
  const items = (itemsRes.data ?? []) as SegmentItemRow[];

  // Stats
  const contributors = new Set(observations.map((o) => o.contributor).filter(Boolean));
  const areas = new Set(observations.map((o) => o.area));

  // Area breakdown
  const areaCounts = new Map<string, number>();
  for (const obs of observations) {
    areaCounts.set(obs.area, (areaCounts.get(obs.area) ?? 0) + 1);
  }
  const areaBreakdown = [...areaCounts.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);

  // Bucket breakdown across all segments
  const segmentMap = new Map(segments.map((s) => [s.id, s.name]));
  const bucketCounts: Partial<Record<Bucket, number>> = {};
  for (const item of items) {
    const b = item.bucket as Bucket;
    bucketCounts[b] = (bucketCounts[b] ?? 0) + 1;
  }

  // Recent observations with a contributor as "voices"
  const voices = observations
    .filter((o) => o.contributor)
    .slice(0, 6)
    .map((o) => ({
      id: o.id,
      contributor: o.contributor!,
      area: o.area,
      body: o.body,
      sourceUrl: o.source_url,
      createdAt: o.created_at,
    }));

  // Recent activity — last 8 items + observations combined, sorted by date
  const recentItems = items.slice(0, 5).map((i) => ({
    type: "insight" as const,
    title: i.title,
    detail: BUCKET_LABEL[i.bucket as Bucket] ?? i.bucket,
    segment: segmentMap.get(i.segment_id) ?? "Unknown",
    date: i.created_at,
  }));
  const recentObs = observations.slice(0, 5).map((o) => ({
    type: "observation" as const,
    title: o.body.length > 80 ? o.body.slice(0, 80) + "…" : o.body,
    detail: o.area,
    segment: o.contributor ?? "Anonymous",
    date: o.created_at,
  }));
  const activity = [...recentItems, ...recentObs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return NextResponse.json({
    stats: {
      observations: observations.length,
      segments: segments.length,
      insights: items.length,
      contributors: contributors.size,
      areas: areas.size,
    },
    areaBreakdown,
    bucketCounts,
    voices,
    activity,
  });
}

const BUCKET_LABEL: Record<Bucket, string> = {
  needs: "Need",
  pain_points: "Opportunity",
  opportunities: "Opportunity",
  actionable_insights: "Actionable Insight",
};
