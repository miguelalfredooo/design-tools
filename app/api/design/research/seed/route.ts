import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ── Mock Observations ───────────────────────────────────────────────────────

const mockObservations = [
  // Sharing
  { body: "User hovered over share button for 12 seconds before giving up. Tooltip says 'Share' but doesn't explain what happens next.", area: "Sharing", contributor: "Maya R." },
  { body: "Three users in a row tried to long-press the share icon expecting a copy-link option. None found it.", area: "Sharing", contributor: "Carlos D." },
  { body: "After sharing to Instagram Stories, user returned to the app and looked confused — no confirmation that it worked.", area: "Sharing", contributor: "Maya R." },
  { body: "Power user shared 4 posts in one session but had to repeat the same 3-tap flow each time. No 'share again' shortcut.", area: "Sharing", contributor: "Jin W." },
  { body: "User on Android could not find the share sheet — tapped the three-dot menu instead. Different from iOS behavior.", area: "Sharing", contributor: "Priya S." },

  // Post Composer
  { body: "Creator spent 3 minutes looking for the bold/italic formatting bar. It was hidden behind a '...' menu.", area: "Post Composer", contributor: "Carlos D." },
  { body: "User pasted a long URL and the composer didn't auto-preview it. They manually typed a description instead.", area: "Post Composer", contributor: "Jin W." },
  { body: "Draft auto-saved but the user didn't notice. They manually copied text to Notes app 'just in case'.", area: "Post Composer", contributor: "Maya R." },
  { body: "Image upload took 8 seconds with no progress indicator. User tapped upload button again, creating a duplicate.", area: "Post Composer", contributor: "Priya S." },
  { body: "Composer loses all content when user accidentally swipes back on mobile. No 'unsaved changes' warning.", area: "Post Composer", contributor: "Carlos D." },

  // Entry Points
  { body: "New user from email invite landed on homepage instead of the shared post. Had to search for the content.", area: "Entry Points", contributor: "Jin W." },
  { body: "Deep link from push notification opened correctly on iOS but showed a blank screen on Android for 2 seconds.", area: "Entry Points", contributor: "Priya S." },
  { body: "User clicked 'Open in App' banner on mobile web but the app opened to home, not the content they were viewing.", area: "Entry Points", contributor: "Maya R." },

  // Onboarding
  { body: "User skipped profile photo step. Later complained their posts look 'anonymous' because they didn't realize it was the same thing.", area: "Onboarding", contributor: "Carlos D." },
  { body: "Three of five users chose 'Skip' on the interests picker. Those users showed 40% lower engagement in week 1.", area: "Onboarding", contributor: "Jin W." },
  { body: "User expected to see sample content during onboarding to understand what the platform is about. Got an empty feed instead.", area: "Onboarding", contributor: "Maya R." },

  // Content Creation
  { body: "Creator wanted to schedule a post for next week but the scheduling UI only shows a date picker, no time selector.", area: "Content Creation", contributor: "Carlos D." },
  { body: "User tried to add a poll to their post but the option wasn't available. They asked in the community chat if it exists.", area: "Content Creation", contributor: "Priya S." },

  // Navigation
  { body: "User tapped the back button 5 times to get from a nested comment thread to the main feed. No breadcrumb or shortcut.", area: "Navigation", contributor: "Jin W." },
  { body: "Bottom tab bar disappears when scrolling down. 3 users looked confused when trying to switch tabs mid-scroll.", area: "Navigation", contributor: "Maya R." },

  // Engagement
  { body: "User received a notification about a reply but couldn't find the original post from the notification screen.", area: "Engagement", contributor: "Priya S." },
  { body: "Like count updates with a 30-second delay. User liked a post, saw no change, and tapped again (toggling it off).", area: "Engagement", contributor: "Carlos D." },

  // Discovery
  { body: "User searched for 'recipes' and got zero results despite 50+ recipe posts existing. Search only matches titles, not body text.", area: "Discovery", contributor: "Jin W." },
  { body: "Trending section showed the same 3 posts for 48 hours. Users reported it felt 'dead'.", area: "Discovery", contributor: "Maya R." },

  // Notifications
  { body: "User turned off all notifications because there's no granular control — it's all-or-nothing.", area: "Notifications", contributor: "Priya S." },

  // Permissions
  { body: "Admin tried to remove a comment but the delete button only appeared after refreshing the page.", area: "Permissions", contributor: "Carlos D." },
];

// ── Mock Segments ───────────────────────────────────────────────────────────

const mockSegments = [
  {
    name: "Active Members",
    description: "Engaged users who visit 3+ times per week and interact with content regularly.",
    items: [
      { bucket: "needs", title: "Faster content discovery", body: "Active members spend most of their time in the feed but want better ways to find relevant content without endless scrolling." },
      { bucket: "needs", title: "Notification granularity", body: "They want to stay informed but feel overwhelmed by notification volume. Need per-category controls." },
      { bucket: "pain_points", title: "Search doesn't match expectations", body: "Full-text search is expected but only title matching exists. Users resort to manual scrolling." },
      { bucket: "pain_points", title: "Share flow is too many taps", body: "Power users share frequently but the current flow requires 3-4 taps for every share action." },
      { bucket: "opportunities", title: "Quick-share shortcuts", body: "Add swipe-to-share or long-press share to reduce friction for frequent sharers." },
      { bucket: "opportunities", title: "Smart feed ranking", body: "Personalized feed ordering based on interaction history could surface relevant content faster." },
      { bucket: "actionable_insights", title: "Implement full-text search", body: "Index post bodies and comments in addition to titles. This alone would resolve 23% of reported discovery issues." },
    ],
  },
  {
    name: "Content Creators",
    description: "Users who publish posts, write articles, or create media content for the community.",
    items: [
      { bucket: "needs", title: "Rich text editing tools", body: "Creators expect formatting options (bold, italic, headings, links) to be easily accessible, not hidden behind menus." },
      { bucket: "needs", title: "Draft confidence", body: "Auto-save exists but isn't communicated. Creators don't trust it and use external apps as backup." },
      { bucket: "pain_points", title: "No upload progress feedback", body: "Image uploads show no progress bar, leading to duplicate uploads and confusion." },
      { bucket: "pain_points", title: "Composer loses work on back-swipe", body: "Accidental navigation destroys in-progress posts with no recovery option." },
      { bucket: "opportunities", title: "Post scheduling with time picker", body: "Add time selection to the scheduling UI. Currently only date is available, missing a key creator workflow." },
      { bucket: "actionable_insights", title: "Add unsaved changes confirmation", body: "A simple 'You have unsaved changes' dialog on navigation would prevent the most reported creator frustration." },
      { bucket: "actionable_insights", title: "Show auto-save indicator", body: "Display a subtle 'Saved' badge after auto-save triggers to build creator trust in the system." },
    ],
  },
  {
    name: "New Users from Invite",
    description: "Users who arrived via invitation link, email, or shared content — first 7 days.",
    items: [
      { bucket: "needs", title: "Understand the platform purpose", body: "New users from invites arrive with zero context. They need to quickly understand what the community is about." },
      { bucket: "needs", title: "Find the content that was shared with them", body: "Deep links often fail or redirect to the wrong page. The shared content should be front and center." },
      { bucket: "pain_points", title: "Deep links break on Android", body: "Android deep links show a 2-second blank screen. Some users think the app is broken and leave." },
      { bucket: "pain_points", title: "Empty feed after signup", body: "Users who skip the interests picker get an empty feed, which feels like the product has no content." },
      { bucket: "opportunities", title: "Pre-populate feed with curated content", body: "Show a selection of popular posts for new users even before they follow anyone or set interests." },
      { bucket: "opportunities", title: "Onboarding context screen", body: "Add a brief 'What this community is about' screen before the interests picker to give context." },
      { bucket: "actionable_insights", title: "Fix Android deep link blank screen", body: "The 2-second blank state on Android is a critical drop-off point. Adding a loading skeleton would reduce bounce rate." },
    ],
  },
  {
    name: "Mobile-First Users",
    description: "Users who primarily access the platform from mobile devices (>80% of sessions on mobile).",
    items: [
      { bucket: "needs", title: "Consistent cross-platform experience", body: "Share behavior differs between iOS and Android. Users expect the same UI regardless of device." },
      { bucket: "pain_points", title: "Bottom nav disappears on scroll", body: "The hiding bottom tab bar confuses users who need to switch sections mid-scroll." },
      { bucket: "pain_points", title: "Too many back-button taps", body: "Deep content hierarchies (feed → post → comments → thread) require 5+ back taps to return." },
      { bucket: "opportunities", title: "Breadcrumb or jump-to-top", body: "A persistent breadcrumb or 'jump to feed' shortcut would dramatically improve navigation depth." },
      { bucket: "actionable_insights", title: "Keep bottom nav visible on scroll", body: "Removing the auto-hide behavior is a quick win that would eliminate reported confusion." },
    ],
  },
];

// ── Mock Research Insights (for Overview tab) ───────────────────────────────

const mockInsights = [
  // Themes
  { type: "theme", title: "Sharing friction reduces viral growth", body: "The share flow requires too many taps and lacks confirmation feedback. Users who attempt to share give up 35% of the time.", mentions: 8, metadata: { confidence: "validated" } },
  { type: "theme", title: "Composer reliability anxiety", body: "Creators don't trust auto-save and use external tools as backup. The lack of progress indicators during uploads compounds distrust.", mentions: 6, metadata: { confidence: "validated" } },
  { type: "theme", title: "Deep link failures on Android", body: "Entry from shared links and notifications on Android results in blank screens, wrong pages, or lost context. iOS works consistently.", mentions: 5, metadata: { confidence: "validated" } },
  { type: "theme", title: "Empty-state problem for new users", body: "Users who skip onboarding steps or arrive via invite encounter empty feeds, creating a perception that the platform is inactive.", mentions: 4, metadata: { confidence: "assumed" } },
  { type: "theme", title: "Navigation depth trap", body: "Users get lost in nested content (comments, threads, profiles) and resort to excessive back-button tapping to escape.", mentions: 3, metadata: { confidence: "assumed" } },

  // Opportunities
  { type: "opportunity", title: "How might we reduce the share flow to a single interaction?", body: null, metadata: { confidence: "validated", theme: "Sharing friction reduces viral growth" } },
  { type: "opportunity", title: "How might we make draft saving visible and trustworthy?", body: null, metadata: { confidence: "validated", theme: "Composer reliability anxiety" } },
  { type: "opportunity", title: "How might we ensure every external link opens to the right content?", body: null, metadata: { confidence: "validated", theme: "Deep link failures on Android" } },
  { type: "opportunity", title: "How might we make the first visit feel vibrant, not empty?", body: null, metadata: { confidence: "assumed", theme: "Empty-state problem for new users" } },

  // Signals
  { type: "signal", title: "Users manually copy text as backup", body: "3 out of 5 observed creators copied their post text to Notes or a text file before publishing. This signals deep distrust in the composer's reliability." },
  { type: "signal", title: "Share attempts cluster around first post view", body: "80% of share attempts happen within the first 10 seconds of viewing a post. If the share button isn't immediately visible, users don't come back to it." },
  { type: "signal", title: "Android users bounce 2x more from deep links", body: "Android deep link success rate is 58% vs 94% on iOS. This affects 40% of our user base." },

  // Consensus
  { type: "consensus", title: null, body: "All observers agree that the share flow needs fewer steps and better feedback." },
  { type: "consensus", title: null, body: "Full-text search is universally expected and its absence surprises every observed user." },
  { type: "consensus", title: null, body: "The composer's auto-save feature works correctly but is invisible to users — communication, not functionality, is the gap." },

  // Tensions
  { type: "tension", title: null, body: "Hiding the bottom nav on scroll saves space but confuses users. Design wants minimal UI; users want persistent navigation." },
  { type: "tension", title: null, body: "The interests picker during onboarding improves feed quality but 60% of users skip it. Making it mandatory risks higher drop-off." },

  // Open Questions
  { type: "open_question", title: null, body: "Should we implement a 'share again' shortcut for power users, or redesign the entire share flow for everyone?" },
  { type: "open_question", title: null, body: "Is the Android deep link issue a technical bug or a fundamental architecture problem?" },
  { type: "open_question", title: null, body: "How do we balance notification granularity with settings UI complexity?" },

  // One Metric
  { type: "one_metric", title: "Share completion rate: 65%", body: "Only 65% of initiated share actions complete successfully. Improving this to 90%+ would directly impact growth loops and viral acquisition." },
];

// ── API Route ───────────────────────────────────────────────────────────────

export async function POST() {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const batchId = crypto.randomUUID();
  const now = new Date().toISOString();
  const results = { observations: 0, segments: 0, segmentItems: 0, insights: 0 };

  // 1. Seed observations
  const obsRows = mockObservations.map((obs, i) => ({
    body: obs.body,
    area: obs.area,
    contributor: obs.contributor,
    source_url: null,
    created_at: new Date(Date.now() - (mockObservations.length - i) * 3600000).toISOString(),
  }));

  const { error: obsError } = await supabase
    .from("research_observations")
    .insert(obsRows);
  if (obsError) {
    return NextResponse.json({ error: `Observations: ${obsError.message}` }, { status: 500 });
  }
  results.observations = obsRows.length;

  // 2. Seed segments and their items
  for (const seg of mockSegments) {
    const { data: segData, error: segError } = await supabase
      .from("research_segments")
      .insert({ name: seg.name, description: seg.description })
      .select("id")
      .single();

    if (segError || !segData) {
      return NextResponse.json({ error: `Segment '${seg.name}': ${segError?.message}` }, { status: 500 });
    }

    results.segments++;

    const itemRows = seg.items.map((item) => ({
      segment_id: segData.id,
      bucket: item.bucket,
      title: item.title,
      body: item.body,
      source_observation_ids: null,
      batch_id: batchId,
      created_at: now,
    }));

    const { error: itemError } = await supabase
      .from("research_segment_items")
      .insert(itemRows);

    if (itemError) {
      return NextResponse.json({ error: `Segment items: ${itemError.message}` }, { status: 500 });
    }
    results.segmentItems += itemRows.length;
  }

  // 3. Seed research insights (for Overview tab)
  const insightRows = mockInsights.map((insight) => ({
    type: insight.type,
    title: insight.title,
    body: insight.body,
    mentions: insight.mentions ?? null,
    tags: null,
    source_session_ids: null,
    metadata: insight.metadata ?? null,
    batch_id: batchId,
    session_id: null,
    created_at: now,
  }));

  const { error: insightError } = await supabase
    .from("research_insights")
    .insert(insightRows);

  if (insightError) {
    return NextResponse.json({ error: `Insights: ${insightError.message}` }, { status: 500 });
  }
  results.insights = insightRows.length;

  return NextResponse.json({
    success: true,
    seeded: results,
    batchId,
  });
}
