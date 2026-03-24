import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("research_brief")
    .select("*")
    .eq("id", "main")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? null);
}

export async function PUT(req: NextRequest) {
  const db = getSupabaseAdmin();
  const body = await req.json();

  const { error } = await db.from("research_brief").upsert({
    id: "main",
    title: body.title ?? null,
    description: body.description ?? null,
    problem_statement: body.problem_statement ?? null,
    idea: body.idea ?? null,
    metrics: body.metrics ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
