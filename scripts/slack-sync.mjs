#!/usr/bin/env node
/**
 * Slack → Research Observations sync
 *
 * Usage:
 *   node scripts/slack-sync.mjs --channel <channel-id-or-name> [--days 7] [--dry-run]
 *
 * Env required (in .env.local or ~/.env.global):
 *   SLACK_BOT_TOKEN     — xoxb-... token with channels:history + users:read
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Load .env.local ──────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
try {
  const envPath = resolve(__dir, "../.env.local");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local optional — rely on shell env
}

// ── Args ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function arg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}
const channelArg = arg("--channel");
const days = parseInt(arg("--days") ?? "7", 10);
const dryRun = args.includes("--dry-run");

if (!channelArg) {
  console.error("Usage: node scripts/slack-sync.mjs --channel <channel-id> [--days 7] [--dry-run]");
  process.exit(1);
}

// ── Validate env ─────────────────────────────────────────────────────────────
const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SLACK_TOKEN) { console.error("Missing SLACK_BOT_TOKEN"); process.exit(1); }
if (!SUPABASE_URL) { console.error("Missing NEXT_PUBLIC_SUPABASE_URL"); process.exit(1); }
if (!SUPABASE_KEY) { console.error("Missing SUPABASE_SERVICE_ROLE_KEY"); process.exit(1); }
if (!ANTHROPIC_KEY) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }

const db = createClient(SUPABASE_URL, SUPABASE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// ── Slack helpers ─────────────────────────────────────────────────────────────
async function slackGet(method, params = {}) {
  const url = new URL(`https://slack.com/api/${method}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${SLACK_TOKEN}` },
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Slack ${method} error: ${json.error}`);
  return json;
}

async function resolveChannel(nameOrId) {
  // If it looks like an ID already (starts with C), use it directly
  if (/^[A-Z0-9]{8,}$/.test(nameOrId)) return nameOrId;
  // Otherwise list channels and find by name
  let cursor;
  do {
    const res = await slackGet("conversations.list", {
      limit: 200,
      exclude_archived: true,
      ...(cursor ? { cursor } : {}),
    });
    const match = res.channels.find(
      (c) => c.name === nameOrId.replace(/^#/, "")
    );
    if (match) return match.id;
    cursor = res.response_metadata?.next_cursor;
  } while (cursor);
  throw new Error(`Channel not found: ${nameOrId}`);
}

async function fetchMessages(channelId, oldestTs) {
  const messages = [];
  let cursor;
  do {
    const res = await slackGet("conversations.history", {
      channel: channelId,
      oldest: oldestTs,
      limit: 200,
      ...(cursor ? { cursor } : {}),
    });
    messages.push(...res.messages);
    cursor = res.response_metadata?.next_cursor;
  } while (cursor);
  return messages;
}

// Cache user display names
const userCache = new Map();
async function getUserName(userId) {
  if (userCache.has(userId)) return userCache.get(userId);
  try {
    const res = await slackGet("users.info", { user: userId });
    const name = res.user.profile.display_name || res.user.profile.real_name || userId;
    userCache.set(userId, name);
    return name;
  } catch {
    return userId;
  }
}

// ── Extract observations with Haiku ──────────────────────────────────────────
const AREA_TAGS = [
  "Sharing", "Post Composer", "Entry Points", "Onboarding",
  "Content Creation", "Navigation", "Permissions", "Notifications",
  "Discovery", "Engagement",
];

async function extractObservations(messages) {
  const text = messages
    .map((m) => `[${m.userName}]: ${m.text}`)
    .join("\n");

  const prompt = `You are a UX research analyst. Below are Slack messages from a user feedback channel.

Extract only messages that contain genuine user feedback, pain points, feature requests, or behavioral observations. Skip meta-conversation, reactions, bot messages, and off-topic chat.

For each valid observation, return a JSON array:
[
  {
    "body": "Clear, neutral 1-2 sentence description of the observation",
    "area": "One of: ${AREA_TAGS.join(", ")}, or a short custom area if none fit",
    "contributor": "Slack username who said it",
    "source_note": "Brief original quote or paraphrase (max 10 words)"
  }
]

Messages:
${text}

Rules:
- Rephrase raw Slack messages into clean UX observation language
- One observation per distinct feedback point (don't bundle unrelated things)
- If a message has no useful feedback, skip it
- Return ONLY a valid JSON array, no markdown`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";
  try {
    const cleaned = raw.replace(/^```json\n?|```$/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    console.error("Failed to parse Haiku response:", raw.slice(0, 300));
    return [];
  }
}

// ── Deduplicate against existing observations ─────────────────────────────────
async function getExistingBodies() {
  const { data } = await db.from("research_observations").select("body");
  return new Set((data ?? []).map((r) => r.body.trim().toLowerCase()));
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(`\n🔍 Slack → Observations sync`);
console.log(`   Channel: ${channelArg}`);
console.log(`   Looking back: ${days} days`);
if (dryRun) console.log(`   DRY RUN — nothing will be inserted\n`);

const channelId = await resolveChannel(channelArg);
console.log(`   Resolved channel ID: ${channelId}`);

const oldestTs = String(Math.floor(Date.now() / 1000) - days * 86400);
const rawMessages = await fetchMessages(channelId, oldestTs);
console.log(`   Fetched ${rawMessages.length} messages`);

// Filter out bot messages and enrich with user names
const humanMessages = rawMessages.filter(
  (m) => m.type === "message" && !m.bot_id && m.text?.trim()
);
const enriched = await Promise.all(
  humanMessages.map(async (m) => ({
    text: m.text,
    userName: await getUserName(m.user),
    ts: m.ts,
  }))
);
console.log(`   ${enriched.length} human messages after filtering`);

if (enriched.length === 0) {
  console.log("   No messages to process. Exiting.");
  process.exit(0);
}

// Process in batches of 30 to stay within token limits
const BATCH = 30;
const allObservations = [];
for (let i = 0; i < enriched.length; i += BATCH) {
  const batch = enriched.slice(i, i + BATCH);
  console.log(`   Extracting observations from messages ${i + 1}–${Math.min(i + BATCH, enriched.length)}...`);
  const obs = await extractObservations(batch);
  allObservations.push(...obs);
}

console.log(`\n✅ Extracted ${allObservations.length} observations from Haiku`);

if (allObservations.length === 0) {
  console.log("   No observations found. Exiting.");
  process.exit(0);
}

// Deduplicate
const existing = await getExistingBodies();
const fresh = allObservations.filter(
  (o) => !existing.has(o.body.trim().toLowerCase())
);
console.log(`   ${fresh.length} new (${allObservations.length - fresh.length} already exist)`);

if (dryRun) {
  console.log("\n📋 Would insert:");
  for (const o of fresh) {
    console.log(`   [${o.area}] ${o.body.slice(0, 80)}...`);
  }
  process.exit(0);
}

if (fresh.length === 0) {
  console.log("   Nothing new to insert.");
  process.exit(0);
}

// Insert
const rows = fresh.map((o) => ({
  body: o.body,
  area: o.area,
  contributor: o.contributor || null,
  source_url: null,
}));

const { error } = await db.from("research_observations").insert(rows);
if (error) {
  console.error("Insert error:", error.message);
  process.exit(1);
}

console.log(`\n🎉 Inserted ${rows.length} observations into research_observations`);
console.log("   Refresh /research → Observations to see them.\n");
