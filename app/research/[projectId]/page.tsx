import { getSupabaseAdmin } from "@/lib/supabase-server";
import { Suspense } from "react";
import type { DashboardData, SegmentSummary, TopItem } from "@/lib/research-dashboard-types";
import type { ObservationRow, SegmentRow, SegmentItemRow, Bucket } from "@/lib/research-hub-types";
import { ResearchClient } from "@/components/design/research-client";
import { notFound } from "next/navigation";

async function getDashboardData(projectId: string): Promise<DashboardData> {
  const db = getSupabaseAdmin();

  const [obsRes, segRes, itemsRes] = await Promise.all([
    db.from("research_observations").select("id, area").eq("project_id", projectId),
    db.from("research_segments").select("id, name").eq("project_id", projectId).order("created_at", { ascending: true }),
    db.from("research_segment_items").select("id, segment_id, bucket, title, body, source_observation_ids"),
  ]);

  const observations = (obsRes.data ?? []) as Pick<ObservationRow, "id" | "area">[];
  const segments = (segRes.data ?? []) as Pick<SegmentRow, "id" | "name">[];
  const items = (itemsRes.data ?? []) as Pick<SegmentItemRow, "id" | "segment_id" | "bucket" | "title" | "body" | "source_observation_ids">[];

  // Filter items to only those belonging to segments in this project
  const projectSegmentIds = new Set(segments.map(s => s.id));
  const projectItems = items.filter(i => projectSegmentIds.has(i.segment_id));

  const areaCounts = new Map<string, number>();
  for (const obs of observations) areaCounts.set(obs.area, (areaCounts.get(obs.area) ?? 0) + 1);
  const areaBreakdown = [...areaCounts.entries()].map(([area, count]) => ({ area, count })).sort((a, b) => b.count - a.count);

  const segmentMap = new Map(segments.map((s) => [s.id, s.name]));
  const segmentItems = new Map<string, SegmentItemRow[]>();
  for (const item of projectItems) {
    const list = segmentItems.get(item.segment_id) ?? [];
    list.push(item as SegmentItemRow);
    segmentItems.set(item.segment_id, list);
  }

  const BUCKET_ORDER: Bucket[] = ["needs", "pain_points", "opportunities", "actionable_insights"];
  const segmentSummaries: SegmentSummary[] = segments.map((seg) => {
    const segItemsList = segmentItems.get(seg.id) ?? [];
    const itemCounts: Partial<Record<Bucket, number>> = {};
    for (const item of segItemsList) itemCounts[item.bucket as Bucket] = (itemCounts[item.bucket as Bucket] ?? 0) + 1;
    return { id: seg.id, name: seg.name, itemCounts, totalItems: segItemsList.length };
  });

  const topItems: TopItem[] = [];
  for (const bucket of BUCKET_ORDER) {
    const bucketItems = projectItems.filter((i) => i.bucket === bucket).slice(0, 2).map((i) => ({
      bucket,
      title: i.title,
      body: i.body,
      segmentName: segmentMap.get(i.segment_id) ?? "Unknown",
      sourceCount: i.source_observation_ids?.length ?? 0,
    }));
    topItems.push(...bucketItems);
  }

  return { observationCount: observations.length, areaBreakdown, segmentCount: segments.length, totalInsights: projectItems.length, segments: segmentSummaries, topItems };
}

export default async function ProjectResearchPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  // Validate project exists
  const db = getSupabaseAdmin();
  const { data: project } = await db.from("research_projects").select("id").eq("id", projectId).maybeSingle();
  if (!project) notFound();

  const dashboard = await getDashboardData(projectId);
  return (
    <Suspense>
      <ResearchClient dashboard={dashboard} projectId={projectId} />
    </Suspense>
  );
}
