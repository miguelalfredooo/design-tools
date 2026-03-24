#!/usr/bin/env node
/**
 * Seed — Creator Tools research data
 *
 * Populates research_observations, research_segments, and research_segment_items
 * with real Creator Tools context from the March 2026 PRD, product brief, and
 * onboarding launch brief.
 *
 * Usage:
 *   node scripts/seed-creator-tools.mjs [--dry-run]
 */

import { createClient } from "@supabase/supabase-js";
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
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local missing — fall back to shell env
}

const dryRun = process.argv.includes("--dry-run");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(supabaseUrl, serviceKey);

// ── Observations ─────────────────────────────────────────────────────────────

const observations = [
  // Content Creation
  {
    body: "Creator tried to schedule posts for an upcoming travel week but found no scheduling option. They copied post text into a Google Doc instead to remember what they planned to write.",
    area: "Content Creation",
    contributor: "Maya R.",
  },
  {
    body: "Creator was offline for 10 days at a conference. Community engagement dropped 43% during that window. No pre-scheduling capability meant the community went completely silent.",
    area: "Content Creation",
    contributor: "Carlos D.",
  },
  {
    body: "Creator manually re-posted their own top post every few days to keep it visible. Said: 'I need a way to just keep this front and center without spamming my readers.'",
    area: "Content Creation",
    contributor: "Jin W.",
  },
  {
    body: "Creator published a post with a typo in the headline. Had no way to edit after publishing. Messaged support requesting deletion and repost — 40 minutes of lost time.",
    area: "Content Creation",
    contributor: "Maya R.",
  },
  {
    body: "Creator said they struggle to maintain posting cadence during busy production weeks. 'If I could queue up 3 posts on Sunday, I'd be so much more consistent.'",
    area: "Content Creation",
    contributor: "Priya S.",
  },

  // Navigation / Performance
  {
    body: "Creator asked 'How do I know which of my posts are actually working?' during onboarding review. Could not find any analytics or performance view on the platform.",
    area: "Navigation",
    contributor: "Carlos D.",
  },
  {
    body: "Creator spent 20 minutes manually scrolling through their post history counting comments to figure out which topics resonated. No aggregate performance view exists.",
    area: "Navigation",
    contributor: "Jin W.",
  },
  {
    body: "Creator said they rely solely on email digests for community performance insight — weekly summaries only, no real-time data. They're flying completely blind between digests.",
    area: "Navigation",
    contributor: "Priya S.",
  },
  {
    body: "Creator mentioned that Substack shows them open rates, click rates, and top posts by engagement. 'I have literally none of that here. I don't know what's worth repeating.'",
    area: "Navigation",
    contributor: "Maya R.",
  },

  // Notifications / Engagement Prompts
  {
    body: "Creator missed a 47-comment thread on a post from 3 days prior — the conversation had fully concluded before they were aware of it. 'I didn't know that was even happening.'",
    area: "Notifications",
    contributor: "Jin W.",
  },
  {
    body: "Creator receives a push notification for every individual like. During a viral post, received 80+ notifications in 2 hours. Turned off all notifications entirely that day.",
    area: "Notifications",
    contributor: "Carlos D.",
  },
  {
    body: "Creator was asked whether AI-suggested engagement moments would be useful. Response: 'Yes — but only if they're actually good. One bad recommendation and I'll ignore all of them.'",
    area: "Notifications",
    contributor: "Priya S.",
  },
  {
    body: "Creator checks their community 'when they remember' — roughly every 3–4 days. They've missed multiple high-engagement conversations and don't know it.",
    area: "Notifications",
    contributor: "Maya R.",
  },
  {
    body: "Creator said they want to be prompted when a conversation is 'actually worth their time' — not just active, but meaningful. Volume alone is not a useful signal.",
    area: "Notifications",
    contributor: "Jin W.",
  },

  // Engagement
  {
    body: "A reader posted a 400-word reflective comment on a creator post. The creator never replied. That reader churned within the following 2 weeks. No one flagged this moment.",
    area: "Engagement",
    contributor: "Maya R.",
  },
  {
    body: "Creator said they feel genuine guilt when they don't respond but 'can't always be on.' They want to know which conversations are worth prioritizing — not just which ones are most recent.",
    area: "Engagement",
    contributor: "Carlos D.",
  },
  {
    body: "Platform data shows 3 consecutive weeks of creator silence resulted in comment volume dropping 67% in that creator's community. No internal alert was triggered. No recovery path exists.",
    area: "Engagement",
    contributor: "Priya S.",
  },
  {
    body: "Pageview spikes correlate clearly with windows of active creator engagement. This pattern is visible in analytics but invisible to creators — they have no way to see or act on it.",
    area: "Engagement",
    contributor: "Jin W.",
  },

  // Post Composer — Mobile
  {
    body: "Creator attempted a mobile reply to a reader comment from their iPhone 14 Pro. The chat text input was unresponsive. They gave up after 4 attempts and never replied.",
    area: "Post Composer",
    contributor: "Maya R.",
  },
  {
    body: "Creator tried to post from their phone during a live event. Composer loaded but form submission failed silently — no error shown, no draft saved. Post was lost entirely.",
    area: "Post Composer",
    contributor: "Carlos D.",
  },

  // Permissions / Delegation
  {
    body: "Creator team member drafted a response for the creator but had no way to publish under the creator's identity. It was posted under their own name instead, confusing readers who expected the creator.",
    area: "Permissions",
    contributor: "Jin W.",
  },
  {
    body: "Creator team member moderated a reader comment without the creator's knowledge. Creator discovered this later and felt their community voice had been overridden without consent.",
    area: "Permissions",
    contributor: "Priya S.",
  },
  {
    body: "Creator had a team member prepare 4 posts but no approval flow existed. Team member published all 4 directly — two were not ready. Creator had to manually delete them.",
    area: "Permissions",
    contributor: "Maya R.",
  },

  // Onboarding
  {
    body: "New creator asked during onboarding: 'What should I be tracking to know if this is working?' The wizard had no answer. They completed setup without any performance benchmarks.",
    area: "Onboarding",
    contributor: "Priya S.",
  },
  {
    body: "Creator said they 'didn't really know what success looked like' after onboarding. Expected guidance on what a healthy community looks like at week 4, week 8, and month 3.",
    area: "Onboarding",
    contributor: "Carlos D.",
  },

  // Discovery / Reader Signals
  {
    body: "Reader who hadn't visited in 18 days returned only after receiving a newsletter — not a community prompt. Said: 'I honestly forgot this existed.' No re-engagement mechanism in the platform.",
    area: "Discovery",
    contributor: "Jin W.",
  },
  {
    body: "Creator asked if there was a way to highlight their best post for new visitors or returning readers. 'I want to control what people see first.' No pinning or featuring capability exists.",
    area: "Discovery",
    contributor: "Maya R.",
  },
];

// ── Segments ─────────────────────────────────────────────────────────────────

const segments = [
  {
    name: "High-Activity Creators",
    items: [
      {
        bucket: "needs",
        title: "Visibility into which content actually drives results",
        body: "Active creators post consistently but have zero signal on which content drives engagement or pageviews. Without a performance view, they repeat what feels right rather than what works.",
      },
      {
        bucket: "needs",
        title: "Ability to schedule content ahead of busy periods",
        body: "Creators with high output need to front-load posts before travel, production weeks, or live events. Real-time presence as a prerequisite for consistent community posting is a structural gap.",
      },
      {
        bucket: "pain_points",
        title: "Missing high-value conversations despite being active",
        body: "Even creators who check regularly miss meaningful reader moments — threads that conclude before they're aware. Notification volume drowns out signal, so they either over-check or check too rarely.",
      },
      {
        bucket: "pain_points",
        title: "No way to surface or maintain high-value content",
        body: "Creators manually re-post or bump content to keep it visible. There is no pinning or featuring capability, so important posts disappear from view as new content is added.",
      },
      {
        bucket: "opportunities",
        title: "Performance dashboard closes a critical blind spot",
        body: "A dashboard showing post-level engagement, pageview correlation, and top content by period would let active creators make data-informed decisions — the same capability competitors offer as table stakes.",
      },
      {
        bucket: "opportunities",
        title: "Smart engagement prompts surface conversations worth joining",
        body: "If prompts are targeted to quality (depth of thread, specific reader signals) rather than volume, high-activity creators would use them. The key signal is relevance, not recency.",
      },
      {
        bucket: "actionable_insights",
        title: "Ship scheduling and performance dashboard as a paired P0",
        body: "Both solve the same root problem: creators flying blind. Scheduling removes the real-time dependency; the dashboard tells them what's working. Together they unlock a consistency loop that neither capability achieves alone.",
      },
    ],
  },
  {
    name: "Lapsing Creators",
    items: [
      {
        bucket: "needs",
        title: "A low-friction path back to community after going quiet",
        body: "Creators who've lapsed face a compounding problem: the longer they're quiet, the more awkward re-entry feels. A guided prompt tied to normal platform activity could remove the mental barrier.",
      },
      {
        bucket: "needs",
        title: "Visibility into what happened while they were absent",
        body: "Returning creators have no way to see what they missed — which conversations happened, which readers were active, whether churn started. Context is the prerequisite for re-engagement.",
      },
      {
        bucket: "pain_points",
        title: "No signal that silence is damaging reader retention",
        body: "Platform data shows reader churn rises after two weeks of creator silence. Creators are unaware this pattern exists. Without a signal, there is no self-correction — and no recovery mechanism.",
      },
      {
        bucket: "pain_points",
        title: "No recovery path once readers have churned",
        body: "Once a reader leaves silently, there is no mechanism to surface them to the creator or prompt a re-engagement moment. The churn is invisible and permanent.",
      },
      {
        bucket: "opportunities",
        title: "Lapsed reader signals enable passive re-engagement",
        body: "Surfacing readers at risk of churning — tied to moments of normal creator activity — could reduce churn with no additional creator effort. The creator doesn't need to do extra work; the timing just needs to be smart.",
      },
      {
        bucket: "opportunities",
        title: "Absence-aware prompts could re-activate creators before readers leave",
        body: "A prompt triggered at day 10–12 of creator silence — before the churn curve steepens — could interrupt the pattern with a single low-effort action (a pinned post, a short reply). Earlier is dramatically better.",
      },
      {
        bucket: "actionable_insights",
        title: "Connect the performance dashboard to absence patterns",
        body: "Show creators what they lost during quiet periods — engagement drop, reader churn estimate, comparison to their active windows. Making the cost of silence visible is the strongest behavioral nudge available.",
      },
    ],
  },
  {
    name: "Creator Teams",
    items: [
      {
        bucket: "needs",
        title: "Ability to post on behalf of a creator with visible attribution",
        body: "Team members managing a creator's community presence need to post in the creator's voice without readers being misled. The current platform has no delegation model — team posts appear under team identity, breaking reader trust.",
      },
      {
        bucket: "needs",
        title: "Draft and approval workflow before publishing",
        body: "Without a review step, team members publish directly — and creators have no oversight. Errors go live, posts go out prematurely, and creators lose control of their own voice. An approval queue is a minimum viable safeguard.",
      },
      {
        bucket: "pain_points",
        title: "No delegation model — team identity bleeds into creator space",
        body: "When a team member replies or posts under their own name in a creator's community, readers notice. Trust erodes when the identity gap becomes visible. Attribution isn't an edge case — it's the core design constraint.",
      },
      {
        bucket: "pain_points",
        title: "No shared visibility into what the creator has already done",
        body: "Team members and creators work in parallel without a shared context view. Duplicate replies, contradictory moderation, and post timing collisions are live risks with no mitigation in the current platform.",
      },
      {
        bucket: "opportunities",
        title: "Attribution-first team posting unlocks creator scale without trust risk",
        body: "A model where team posts are clearly labeled 'posted on behalf of [Creator]' allows scale without identity confusion. Some creator communities (newsletters, podcasts) have established this norm. It's learnable.",
      },
      {
        bucket: "opportunities",
        title: "Approval workflow enables oversight without blocking velocity",
        body: "A lightweight 'draft → creator review → publish' flow gives creators control without requiring them to write everything. Most approvals would take under 60 seconds — the value is protection, not friction.",
      },
      {
        bucket: "actionable_insights",
        title: "Define the attribution model before building delegation",
        body: "The visual treatment of 'posted on behalf of' is the load-bearing design decision. Get it wrong — or ship delegation without it — and reader trust erodes at scale. This needs to be resolved in design before any engineering begins.",
      },
    ],
  },
  {
    name: "Subscribed Readers",
    items: [
      {
        bucket: "needs",
        title: "Consistent creator presence to make the community worth returning to",
        body: "Readers come for the creator. When the creator is absent, the pull disappears. Without a reason to return, habit formation fails — readers gradually stop checking and eventually stop receiving value from membership.",
      },
      {
        bucket: "needs",
        title: "Signal that the creator is back and engaged",
        body: "Returning readers who haven't visited in 2+ weeks have no cue that something has changed. Even a simple 'creator posted this week' trigger in email or push would increase return visit rates meaningfully.",
      },
      {
        bucket: "pain_points",
        title: "Creator silence breaks the habit loop",
        body: "Readers build return visit habits around creator activity. A 2-week silence is enough to break the pattern permanently for a significant share of the audience. The cost compounds over time and is invisible to the platform.",
      },
      {
        bucket: "pain_points",
        title: "No acknowledgment that a reader's contribution was seen",
        body: "Readers who post thoughtful comments and never receive a reply disengage. There is no signal — not even a read receipt — that the creator saw their contribution. The absence of acknowledgment feels like absence of interest.",
      },
      {
        bucket: "opportunities",
        title: "Reader-facing creator activity signals prompt return visits",
        body: "Simple re-engagement triggers — 'your creator posted a new discussion' or 'X people commented since your last visit' — can interrupt lapse trajectories before they become churn. Low engineering lift, meaningful retention impact.",
      },
      {
        bucket: "opportunities",
        title: "Pinned and featured content guides new and returning readers",
        body: "Readers who return after an absence are disoriented by an unstructured feed. Pinned posts and creator-curated highlights give them an immediate entry point and signal where creator attention has been focused.",
      },
      {
        bucket: "actionable_insights",
        title: "Lapsed reader re-engagement only works if paired with creator activation",
        body: "Surfacing lapsed readers to a creator who is also inactive produces nothing. The signal has to land when the creator is positioned to act — ideally as part of a scheduled or prompted posting moment. The systems must be coupled.",
      },
    ],
  },
];

// ── Run ───────────────────────────────────────────────────────────────────────

console.log(`\nCreator Tools research seed — ${dryRun ? "DRY RUN" : "LIVE"}\n`);
console.log(`Observations: ${observations.length}`);
console.log(`Segments: ${segments.length}`);
console.log(`Segment items: ${segments.reduce((n, s) => n + s.items.length, 0)}`);

if (dryRun) {
  console.log("\nDry run complete. Pass no flag to insert.");
  process.exit(0);
}

// Insert observations
console.log("\nInserting observations...");
const obsRows = observations.map((o) => ({
  body: o.body,
  area: o.area,
  contributor: o.contributor,
  source_url: null,
}));

const { error: obsError } = await db.from("research_observations").insert(obsRows);
if (obsError) {
  console.error("Observations insert failed:", obsError.message);
  process.exit(1);
}
console.log(`  ✓ ${obsRows.length} observations inserted`);

// Insert segments and items
console.log("\nInserting segments and items...");
let totalItems = 0;

for (const seg of segments) {
  const { data: segData, error: segError } = await db
    .from("research_segments")
    .insert({ name: seg.name, description: null })
    .select("id")
    .single();

  if (segError || !segData) {
    console.error(`  Segment '${seg.name}' failed:`, segError?.message);
    process.exit(1);
  }

  const itemRows = seg.items.map((item) => ({
    segment_id: segData.id,
    bucket: item.bucket,
    title: item.title,
    body: item.body,
    source_observation_ids: null,
    batch_id: null,
    created_at: new Date().toISOString(),
  }));

  const { error: itemError } = await db.from("research_segment_items").insert(itemRows);
  if (itemError) {
    console.error(`  Items for '${seg.name}' failed:`, itemError.message);
    process.exit(1);
  }

  console.log(`  ✓ ${seg.name} — ${itemRows.length} items`);
  totalItems += itemRows.length;
}

console.log(`\nDone. ${obsRows.length} observations, ${segments.length} segments, ${totalItems} items.\n`);
