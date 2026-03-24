import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const db = getSupabaseAdmin();

  // Fetch projects with observation + segment + insight counts
  const { data: projects, error } = await db
    .from("research_projects")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch counts for each project
  const projectIds = (projects ?? []).map((p: { id: string }) => p.id);

  const [obsRes, segRes] = await Promise.all([
    db.from("research_observations").select("id, project_id").in("project_id", projectIds),
    db.from("research_segments").select("id, project_id").in("project_id", projectIds),
  ]);

  const obsCounts: Record<string, number> = {};
  const segCounts: Record<string, number> = {};
  for (const o of obsRes.data ?? []) obsCounts[o.project_id] = (obsCounts[o.project_id] ?? 0) + 1;
  for (const s of segRes.data ?? []) segCounts[s.project_id] = (segCounts[s.project_id] ?? 0) + 1;

  const result = (projects ?? []).map((p: Record<string, unknown>) => ({
    ...p,
    observationCount: obsCounts[p.id as string] ?? 0,
    segmentCount: segCounts[p.id as string] ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { name, description, problem_statement, idea, metrics } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data, error } = await db
    .from("research_projects")
    .insert({ name: name.trim(), description, problem_statement, idea, metrics })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Seed standard segments for every new project
  const DEFAULT_SEGMENTS = [
    "Content Creators",
    "Community Members",
    "New Users",
    "Regular Members",
    "Lapsed Users",
    "Super Users",
  ];

  await db.from("research_segments").insert(
    DEFAULT_SEGMENTS.map((name) => ({ name, project_id: data.id }))
  );

  return NextResponse.json(data);
}
