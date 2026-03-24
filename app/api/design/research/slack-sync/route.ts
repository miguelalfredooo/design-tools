import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";

const AREA_TAGS = [
  "Publishing", "Performance", "Engagement", "Onboarding", "Team",
  "Tech Support", "Content Moderation", "Feature Request", "Bug Report",
  "Navigation", "Notifications", "Permissions", "Discovery",
];

// ── Slack helpers ─────────────────────────────────────────────────────────────

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

const userCache = new Map<string, string>();
async function getUserName(userId: string): Promise<string> {
  if (userCache.has(userId)) return userCache.get(userId)!;
  try {
    const res = await slackGet("users.info", { user: userId }) as unknown as { user: { profile: { display_name: string; real_name: string } } };
    const name = res.user.profile.display_name || res.user.profile.real_name || userId;
    userCache.set(userId, name);
    return name;
  } catch {
    return userId;
  }
}

async function fetchMessages(channelId: string, days: number) {
  const oldest = String(Math.floor(Date.now() / 1000) - days * 86400);
  const messages: { text: string; userName: string }[] = [];
  let cursor: string | undefined;

  do {
    const res = await slackGet("conversations.history", {
      channel: channelId,
      oldest,
      limit: "200",
      ...(cursor ? { cursor } : {}),
    }) as unknown as { messages: { type: string; bot_id?: string; text?: string; user?: string; ts: string }[]; response_metadata?: { next_cursor?: string } };

    const human = res.messages.filter((m) => m.type === "message" && !m.bot_id && m.text?.trim());
    const enriched = await Promise.all(
      human.map(async (m) => ({
        text: m.text!,
        userName: m.user ? await getUserName(m.user) : "unknown",
      }))
    );
    messages.push(...enriched);
    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor);

  return messages;
}

// ── Haiku extraction ──────────────────────────────────────────────────────────

async function extractObservations(
  messages: { text: string; userName: string }[],
  channelName: string
) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const text = messages.map((m) => `[${m.userName}]: ${m.text}`).join("\n");

  const prompt = `You are a UX research analyst. Below are Slack messages from the "${channelName}" channel.

Extract only messages that contain genuine user feedback, pain points, feature requests, or behavioral observations. Skip meta-conversation, reactions, bot messages, and off-topic chat.

For each valid observation return a JSON array:
[
  {
    "body": "Clear, neutral 1-2 sentence description of the observation",
    "area": "One of: ${AREA_TAGS.join(", ")}, or a short custom area if none fit",
    "contributor": "Slack username who said it"
  }
]

Messages:
${text}

Rules:
- Rephrase raw Slack messages into clean UX observation language
- One observation per distinct feedback point
- Skip messages with no useful feedback
- Return ONLY a valid JSON array, no markdown`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    return JSON.parse(raw.replace(/^```json\n?|```$/g, "").trim()) as { body: string; area: string; contributor: string }[];
  } catch {
    return [];
  }
}

// ── POST /api/design/research/slack-sync ─────────────────────────────────────

async function resolveChannelId(channelName: string): Promise<string> {
  let cursor: string | undefined;
  do {
    const res = await slackGet("conversations.list", {
      limit: "200",
      types: "public_channel",
      ...(cursor ? { cursor } : {}),
    }) as unknown as {
      channels: { id: string; name: string }[];
      response_metadata?: { next_cursor?: string };
    };
    const match = res.channels.find((c) => c.name === channelName);
    if (match) return match.id;
    cursor = res.response_metadata?.next_cursor || undefined;
  } while (cursor);
  throw new Error(`Channel #${channelName} not found or bot is not a member`);
}

export async function POST(req: NextRequest) {
  const SLACK_INBOX_ID = "00000000-0000-0000-0000-000000000001";

  const { projectId, channelName, days = 7 } = await req.json() as {
    projectId?: string | null;
    channelName: string;
    days?: number;
  };

  // Null means Slack inbox — fall back to the sentinel project ID
  const resolvedProjectId = projectId ?? SLACK_INBOX_ID;

  if (!channelName) {
    return NextResponse.json({ error: "channelName is required" }, { status: 400 });
  }

  if (!process.env.SLACK_BOT_TOKEN) {
    return NextResponse.json({ error: "SLACK_BOT_TOKEN is not configured" }, { status: 503 });
  }

  const db = getSupabaseAdmin();

  // Resolve channel name → ID, then fetch messages
  let messages: { text: string; userName: string }[];
  try {
    const channelId = await resolveChannelId(channelName);
    messages = await fetchMessages(channelId, days);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  if (messages.length === 0) {
    return NextResponse.json({ inserted: 0, message: "No messages found in the selected time range." });
  }

  // Extract in batches of 30
  const BATCH = 30;
  const allObservations: { body: string; area: string; contributor: string }[] = [];
  for (let i = 0; i < messages.length; i += BATCH) {
    const batch = messages.slice(i, i + BATCH);
    const obs = await extractObservations(batch, channelName);
    allObservations.push(...obs);
  }

  if (allObservations.length === 0) {
    return NextResponse.json({ inserted: 0, message: "No observations extracted from messages." });
  }

  // Deduplicate against existing observations for this project
  const { data: existing } = await db
    .from("research_observations")
    .select("body")
    .eq("project_id", resolvedProjectId);

  const existingBodies = new Set((existing ?? []).map((r: { body: string }) => r.body.trim().toLowerCase()));
  const fresh = allObservations.filter((o) => !existingBodies.has(o.body.trim().toLowerCase()));

  if (fresh.length === 0) {
    return NextResponse.json({ inserted: 0, message: "All observations already exist for this project." });
  }

  const { error } = await db.from("research_observations").insert(
    fresh.map((o) => ({
      body: o.body,
      area: o.area,
      contributor: o.contributor || null,
      source_url: `slack://${channelName}`,
      project_id: resolvedProjectId,
    }))
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    inserted: fresh.length,
    skipped: allObservations.length - fresh.length,
    messagesProcessed: messages.length,
  });
}
