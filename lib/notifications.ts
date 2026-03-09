import { getSupabaseAdmin } from "@/lib/supabase-server";

export type NotificationType = "session_created" | "vote_cast" | "comment_added";

export async function insertNotification({
  type,
  sessionId,
  sessionTitle,
  actorName,
  message,
  link,
}: {
  type: NotificationType;
  sessionId: string;
  sessionTitle: string;
  actorName?: string;
  message: string;
  link: string;
}) {
  const db = getSupabaseAdmin();
  await db.from("carrier_notifications").insert({
    type,
    session_id: sessionId,
    session_title: sessionTitle,
    actor_name: actorName ?? null,
    message,
    link,
  });
}
