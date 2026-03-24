import { NextResponse } from "next/server";

async function slackGet(method: string, params: Record<string, string> = {}) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("SLACK_BOT_TOKEN is not set");

  const url = new URL(`https://slack.com/api/${method}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json() as { ok: boolean; error?: string; [key: string]: unknown };
  if (!json.ok) throw new Error(`Slack ${method}: ${json.error}`);
  return json;
}

// Target channels to surface in the Slack inbox
const TARGET_NAMES = [
  "community-watchdawgs",
  "community-tech-support",
  "community-content-escalations",
];

export async function GET() {
  if (!process.env.SLACK_BOT_TOKEN) {
    return NextResponse.json({ error: "SLACK_BOT_TOKEN is not configured" }, { status: 503 });
  }

  try {
    const channels: { id: string; name: string }[] = [];
    let cursor: string | undefined;

    do {
      const res = await slackGet("conversations.list", {
        limit: "200",
        types: "public_channel",
        ...(cursor ? { cursor } : {}),
      }) as unknown as {
        channels: { id: string; name: string; is_member: boolean }[];
        response_metadata?: { next_cursor?: string };
      };

      const matched = res.channels.filter((c) => TARGET_NAMES.includes(c.name));
      channels.push(...matched.map((c) => ({ id: c.id, name: c.name })));
      cursor = res.response_metadata?.next_cursor || undefined;
    } while (cursor && channels.length < TARGET_NAMES.length);

    return NextResponse.json(channels);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
