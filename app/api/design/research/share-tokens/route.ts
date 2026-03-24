import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { ShareTokenRow } from "@/lib/research-hub-types";

export async function GET() {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from("research_share_tokens")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as ShareTokenRow[]);
}

export async function POST(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { createdBy, context, projectId } = await req.json();

  // Expires in 30 days by default
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const { data, error } = await db
    .from("research_share_tokens")
    .insert({
      created_by: createdBy || null,
      expires_at: expiresAt.toISOString(),
      context: context || null,
      project_id: projectId || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as ShareTokenRow);
}

export async function DELETE(req: NextRequest) {
  const db = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await db
    .from("research_share_tokens")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
