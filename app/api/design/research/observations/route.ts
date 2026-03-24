import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { ObservationRow } from "@/lib/research-hub-types";
import { observationFromRow } from "@/lib/research-hub-types";

export async function GET(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const area = searchParams.get("area");
  const projectId = searchParams.get("projectId");

  let query = db
    .from("research_observations")
    .select("*")
    .order("created_at", { ascending: false });

  if (area) {
    query = query.eq("area", area);
  }

  if (projectId === "null") {
    query = query.eq("project_id", "00000000-0000-0000-0000-000000000001");
  } else if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    (data as ObservationRow[]).map(observationFromRow)
  );
}

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { body, area, contributor, sourceUrl, token, projectId } = await req.json();

  if (!body || !area) {
    return NextResponse.json(
      { error: "body and area are required" },
      { status: 400 }
    );
  }

  // If token provided, validate it and pull project_id from it
  let tokenProjectId: string | null = null;
  if (token) {
    const { data: tokenRow } = await db
      .from("research_share_tokens")
      .select("id, expires_at, project_id")
      .eq("token", token)
      .single();

    if (!tokenRow) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    tokenProjectId = tokenRow.project_id ?? null;
  }

  const resolvedProjectId = projectId || tokenProjectId || '00000000-0000-0000-0000-000000000001';

  const { data, error } = await db
    .from("research_observations")
    .insert({
      body,
      area,
      contributor: contributor || null,
      source_url: sourceUrl || null,
      project_id: resolvedProjectId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(observationFromRow(data as ObservationRow));
}
