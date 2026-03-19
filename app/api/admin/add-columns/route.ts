import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Missing Supabase credentials" },
      { status: 500 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const sqls = [
      "ALTER TABLE research_observations ADD COLUMN IF NOT EXISTS area TEXT",
      "ALTER TABLE research_observations ADD COLUMN IF NOT EXISTS contributor TEXT",
      "ALTER TABLE research_observations ADD COLUMN IF NOT EXISTS source_url TEXT",
      "ALTER TABLE research_observations ADD COLUMN IF NOT EXISTS body TEXT",
      "CREATE INDEX IF NOT EXISTS idx_research_observations_area ON research_observations(area)",
    ];

    for (const sql of sqls) {
      await supabase.rpc("exec", { query: sql });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to add columns", details: String(error) },
      { status: 500 }
    );
  }
}
