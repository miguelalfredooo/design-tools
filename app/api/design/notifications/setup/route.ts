import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

/**
 * One-time setup endpoint to verify notification tables exist.
 * Call POST /api/design/notifications/setup to check.
 */
export async function POST() {
  const db = getSupabaseAdmin();

  const { error: e1 } = await db
    .from("carrier_notifications")
    .select("id")
    .limit(1);

  const { error: e2 } = await db
    .from("carrier_notification_reads")
    .select("id")
    .limit(1);

  if (e1 || e2) {
    return NextResponse.json({
      error: "Tables missing. Run the SQL from docs/sql/carrier_notifications.sql in the Supabase SQL Editor.",
    }, { status: 500 });
  }

  return NextResponse.json({ ok: true, message: "Tables exist and are ready." });
}
