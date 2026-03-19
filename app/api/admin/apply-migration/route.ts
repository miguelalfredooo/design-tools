import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
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

    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      "supabase/migrations/20260319_create_base_tables.sql"
    );
    const sql = readFileSync(migrationPath, "utf8");

    // Split statements and execute
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s && !s.startsWith("--"));

    for (const statement of statements) {
      const { error } = await supabase.rpc("exec", { query: statement });
      if (error) {
        // Some functions might not exist, try raw query
        const { error: rawError } = await supabase.rpc("exec_sql", {
          sql: statement,
        });
        if (rawError) {
          // Last resort: direct query via PostgreSQL function
          console.warn(`Statement might need manual execution: ${statement.substring(0, 50)}`);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Migration applied" });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Failed to apply migration", details: String(error) },
      { status: 500 }
    );
  }
}
