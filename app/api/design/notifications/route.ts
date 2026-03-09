import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 50);
  const voterId = searchParams.get("voterId");

  if (!voterId) {
    return NextResponse.json({ error: "Missing voterId" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Fetch recent notifications
  const { data: notifications, error } = await db
    .from("carrier_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch this user's reads
  const notifIds = (notifications ?? []).map((n) => n.id);
  const { data: reads } = notifIds.length > 0
    ? await db
        .from("carrier_notification_reads")
        .select("notification_id")
        .eq("voter_id", voterId)
        .in("notification_id", notifIds)
    : { data: [] };

  const readSet = new Set((reads ?? []).map((r) => r.notification_id));

  const enriched = (notifications ?? []).map((n) => ({
    ...n,
    read: readSet.has(n.id),
  }));

  const unreadCount = enriched.filter((n) => !n.read).length;

  return NextResponse.json({ notifications: enriched, unreadCount });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { voterId } = body;

  if (!voterId) {
    return NextResponse.json({ error: "Missing voterId" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Get all unread notification IDs for this voter
  const { data: allNotifs } = await db
    .from("carrier_notifications")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!allNotifs || allNotifs.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const { data: existingReads } = await db
    .from("carrier_notification_reads")
    .select("notification_id")
    .eq("voter_id", voterId)
    .in("notification_id", allNotifs.map((n) => n.id));

  const alreadyRead = new Set((existingReads ?? []).map((r) => r.notification_id));
  const toInsert = allNotifs
    .filter((n) => !alreadyRead.has(n.id))
    .map((n) => ({ notification_id: n.id, voter_id: voterId }));

  if (toInsert.length > 0) {
    const { error } = await db
      .from("carrier_notification_reads")
      .insert(toInsert);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
