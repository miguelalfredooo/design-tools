import { getSupabaseAdmin } from "@/lib/supabase-server";
import { Suspense } from "react";
import { ProjectIndex, type Project } from "@/components/design/research/project-index";

async function getProjects() {
  const db = getSupabaseAdmin();
  const { data: projects } = await db
    .from("research_projects")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const projectIds = (projects ?? []).map((p: { id: string }) => p.id);
  if (projectIds.length === 0) return [];

  const [obsRes, segRes] = await Promise.all([
    db.from("research_observations").select("id, project_id").in("project_id", projectIds),
    db.from("research_segments").select("id, project_id").in("project_id", projectIds),
  ]);

  const obsCounts: Record<string, number> = {};
  const segCounts: Record<string, number> = {};
  for (const o of obsRes.data ?? []) obsCounts[o.project_id] = (obsCounts[o.project_id] ?? 0) + 1;
  for (const s of segRes.data ?? []) segCounts[s.project_id] = (segCounts[s.project_id] ?? 0) + 1;

  return (projects ?? []).map((p: Record<string, unknown>) => ({
    ...(p as Omit<Project, "observationCount" | "segmentCount">),
    observationCount: obsCounts[p.id as string] ?? 0,
    segmentCount: segCounts[p.id as string] ?? 0,
  })) as Project[];
}

export default async function ResearchPage() {
  const projects = await getProjects();
  return (
    <Suspense>
      <ProjectIndex initialProjects={projects} />
    </Suspense>
  );
}
