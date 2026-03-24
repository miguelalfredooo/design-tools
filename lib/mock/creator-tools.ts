import type { DataConfidenceMeta } from "@/lib/data-confidence";

export const creatorToolsNav = [
  { href: "/drops/creator-tools/prd", label: "PRD / Brief" },
  { href: "/drops/creator-tools", label: "Overview" },
  { href: "/drops/creator-tools/themes", label: "What's Working" },
  { href: "/drops/creator-tools/audience", label: "Audience" },
  { href: "/drops/creator-tools/threads", label: "Show Up Now" },
  { href: "/drops/creator-tools/actions", label: "Next Steps" },
  { href: "/drops/creator-tools/controls", label: "Controls" },
  { href: "/drops/creator-tools/nudges", label: "Nudges" },
] as const;

export const creatorToolsSubNav = [
  {
    rootHref: "/drops/creator-tools/controls",
    items: [
      { href: "/drops/creator-tools/controls", label: "Overview" },
      { href: "/drops/creator-tools/controls/scheduler", label: "Scheduling" },
      { href: "/drops/creator-tools/controls/pins", label: "Pins" },
      { href: "/drops/creator-tools/controls/team-review", label: "Team Review" },
      { href: "/drops/creator-tools/controls/moderation", label: "Moderation" },
    ],
  },
  {
    rootHref: "/drops/creator-tools/nudges",
    items: [
      { href: "/drops/creator-tools/nudges", label: "Overview" },
      { href: "/drops/creator-tools/nudges/high-signal-question", label: "High-Signal Question" },
      { href: "/drops/creator-tools/nudges/lapsed-reader", label: "Lapsed Reader" },
      { href: "/drops/creator-tools/nudges/conversation-starter", label: "Conversation Starter" },
    ],
  },
] as const;

export const creatorToolsModules = [
  {
    title: "What's Working",
    href: "/drops/creator-tools/themes",
    insight:
      "See which topics, formats, and reader patterns are actually driving engagement.",
    spotlightLabel: "Leading signal",
    spotlightValue: "Meal prep systems are carrying the strongest repeat engagement.",
    supporting:
      "Use this first before deciding what to repeat, expand, or turn into the next creator move.",
    ctaLabel: "Open performance signals",
    status: "Performance",
  },
  {
    title: "Show Up Now",
    href: "/drops/creator-tools/threads",
    insight:
      "Move straight into the conversations that are most worth a creator response right now.",
    spotlightLabel: "Highest-value response",
    spotlightValue: "Readers are asking for concrete templates they can use this week.",
    supporting:
      "Go here when the real question is where creator attention matters most, not just what is trending.",
    ctaLabel: "Open participation signals",
    status: "Participation",
  },
  {
    title: "Next Steps",
    href: "/drops/creator-tools/actions",
    insight:
      "Turn signal into an immediate move: reply, schedule, pin, or delegate.",
    spotlightLabel: "Recommended move now",
    spotlightValue: "Schedule the meal-prep template post, then reply in the breakout thread.",
    supporting:
      "This is the clearest path from insight to action when the team needs a confident recommendation now.",
    ctaLabel: "Open action recommendations",
    status: "Action",
  },
] as const;

export const creatorToolsSupportingSurfaces = [
  {
    title: "Audience Context",
    href: "/drops/creator-tools/audience",
    summary:
      "Open this when you need more context on who is returning, drifting, or deepening engagement behind the top signals.",
  },
  {
    title: "Publishing Controls",
    href: "/drops/creator-tools/controls",
    summary:
      "Scheduling, pinning, moderation, and delegated publishing support execution after a next step has been chosen.",
  },
  {
    title: "Prompt Patterns",
    href: "/drops/creator-tools/nudges",
    summary:
      "High-signal questions, re-engagement cues, and conversation starters support follow-through without crowding the primary flow.",
  },
] as const;

export const creatorToolsPrdHighlights = [
  {
    title: "Posting consistency",
    body:
      "Creators need to stay present without being online in real time. V1 starts by reducing the operational friction that causes silence.",
  },
  {
    title: "Performance visibility",
    body:
      "Creators need to know what content is actually driving engagement and pageviews so they can repeat what works.",
  },
  {
    title: "Timely participation",
    body:
      "Creators need help identifying which conversations deserve attention now instead of monitoring the community manually.",
  },
] as const;

export const creatorToolsV1Pillars = [
  {
    title: "Post & Community Controls",
    summary:
      "Scheduling, pinning, moderation, and delegation create consistency without forcing creators to be online at every moment.",
    outcomes: [
      "More consistent posting cadence",
      "Higher trust in creator-side controls",
    ],
    href: "/drops/creator-tools/controls",
  },
  {
    title: "Performance Understanding",
    summary:
      "Analytics should answer what is working and what to do next, not dump raw numbers on the creator.",
    outcomes: [
      "Better content decisions",
      "Stronger link between engagement and pageviews",
    ],
    href: "/drops/creator-tools/themes",
  },
  {
    title: "Engagement Prompts",
    summary:
      "High-signal questions, lapsed reader cues, and conversation starters help creators show up at the right moment.",
    outcomes: [
      "More timely participation",
      "Reduced reader churn",
    ],
    href: "/drops/creator-tools/nudges",
  },
] as const;

export const creatorToolsSuccessMetrics = [
  {
    label: "Posting frequency",
    target: "+25%",
    detail: "posts per creator per month",
  },
  {
    label: "Creator habit formation",
    target: "+15%",
    detail: "DAU / WAU vs. baseline",
  },
  {
    label: "Session pageviews",
    target: "+10%",
    detail: "pageviews per community session",
  },
] as const;

export const creatorToolsRolloutNotes = [
  "Beta with a small cohort of high-activity creators before broad release.",
  "Expand by creator activity tier after validating adoption and prompt quality.",
  "Treat Sprint 0 research as the gate before engineering commit on deferred areas like integrations.",
] as const;

export const creatorToolsConfidenceSummary = {
  anchor: {
    state: "confirmed",
    label: "Confirmed evidence anchor",
    source: "Weekly analytics export + community activity snapshot",
    owner: "Data partner",
    verifiedAt: "March 10, 2026",
  } satisfies DataConfidenceMeta,
  statuses: [
    {
      state: "confirmed",
      label: "4 confirmed",
    },
    {
      state: "in_review",
      label: "2 in review",
    },
    {
      state: "unverified",
      label: "1 unverified",
    },
  ] as const,
};

export const overviewFindings = [
  {
    title: "Meal prep is becoming the community's anchor topic",
    summary:
      "Conversation depth and repeat visits are compounding around practical prep systems rather than one-off recipes.",
    href: "/drops/creator-tools/themes",
    cta: "Explore themes",
    confidence: {
      state: "confirmed",
      label: "Confirmed",
      source: "Topic clustering + repeat visit trend",
      owner: "Miguel",
      verifiedAt: "March 10, 2026",
    } satisfies DataConfidenceMeta,
  },
  {
    title: "Reactivated readers are clustering around budget advice",
    summary:
      "Members who had gone quiet are showing up again when threads connect meal planning to savings and routine.",
    href: "/drops/creator-tools/audience",
    cta: "See audience segments",
    confidence: {
      state: "in_review",
      label: "In Review",
      source: "Reader return cohort draft",
      owner: "Miguel",
      note: "Needs final QA against source cohort definition.",
    } satisfies DataConfidenceMeta,
  },
  {
    title: "One thread is carrying an outsized share of community momentum",
    summary:
      "The top meal-prep thread is pulling comments, creator mentions, and unresolved questions that can still be acted on.",
    href: "/drops/creator-tools/threads",
    cta: "Open threads",
    confidence: {
      state: "unverified",
      label: "Unverified",
      source: "Manual thread scan",
      owner: "Miguel",
      note: "Directional only until thread counts are reconciled.",
    } satisfies DataConfidenceMeta,
  },
];

export const analyticsKpis = [
  {
    label: "Community reach",
    value: "48.2K",
    delta: "+12%",
    detail: "7-day pageview growth",
    tone: "positive" as const,
    confidence: {
      state: "confirmed",
      label: "Confirmed",
      source: "Weekly analytics export",
      owner: "Data partner",
      verifiedAt: "March 10, 2026",
    } satisfies DataConfidenceMeta,
  },
  {
    label: "Active participants",
    value: "6.4K",
    delta: "+8%",
    detail: "commented, reacted, or revisited",
    tone: "positive" as const,
    confidence: {
      state: "in_review",
      label: "In Review",
      source: "Community activity rollup",
      owner: "Miguel",
      note: "Awaiting duplicate-user check.",
    } satisfies DataConfidenceMeta,
  },
  {
    label: "Response coverage",
    value: "71%",
    delta: "14 open",
    detail: "high-signal threads still waiting",
    tone: "neutral" as const,
    confidence: {
      state: "confirmed",
      label: "Confirmed",
      source: "Thread response audit",
      owner: "Miguel",
      verifiedAt: "March 10, 2026",
    } satisfies DataConfidenceMeta,
  },
  {
    label: "Best posting window",
    value: "Tue-Thu",
    delta: "8-10 AM",
    detail: "peak click-through and replies",
    tone: "neutral" as const,
    confidence: {
      state: "unverified",
      label: "Unverified",
      source: "Directional posting pattern sample",
      owner: "Miguel",
      note: "Useful for exploration, not yet validated.",
    } satisfies DataConfidenceMeta,
  },
];

export const pageviewTrend = [
  { day: "Mon", pageviews: 6200, engaged: 710 },
  { day: "Tue", pageviews: 7100, engaged: 860 },
  { day: "Wed", pageviews: 6800, engaged: 820 },
  { day: "Thu", pageviews: 9100, engaged: 1120 },
  { day: "Fri", pageviews: 10800, engaged: 1260 },
  { day: "Sat", pageviews: 9600, engaged: 1010 },
  { day: "Sun", pageviews: 11800, engaged: 1380 },
];

export const trafficSources = [
  { name: "Direct", value: 38, fill: "#111827" },
  { name: "Notifications", value: 29, fill: "#f59e0b" },
  { name: "Search", value: 21, fill: "#10b981" },
  { name: "Email", value: 12, fill: "#3b82f6" },
];

export const themes = [
  {
    theme: "Meal prep systems",
    momentum: 34,
    status: "rising",
    summary:
      "Practical routines, templates, and repeatable prep frameworks are creating the deepest discussion.",
    relatedAudience: "Highly engaged regulars",
    relatedAudienceHref: "/drops/creator-tools/audience",
    relatedThreadHref: "/drops/creator-tools/threads",
  },
  {
    theme: "Budget shortcuts",
    momentum: 22,
    status: "rising",
    summary:
      "Savings-oriented advice is reactivating quieter readers and creating strong follow-up questions.",
    relatedAudience: "Reactivated readers",
    relatedAudienceHref: "/drops/creator-tools/audience",
    relatedThreadHref: "/drops/creator-tools/nudges/lapsed-reader",
  },
  {
    theme: "Family routine hacks",
    momentum: 19,
    status: "steady",
    summary:
      "Routine-oriented content remains dependable, especially when it includes printable or reusable structures.",
    relatedAudience: "Caregiver planners",
    relatedAudienceHref: "/drops/creator-tools/audience",
    relatedThreadHref: "/drops/creator-tools/threads",
  },
  {
    theme: "Pantry resets",
    momentum: 14,
    status: "cooling",
    summary:
      "Interest is still present, but discussion is becoming more tactical and less socially contagious.",
    relatedAudience: "Drifting subscribers",
    relatedAudienceHref: "/drops/creator-tools/audience",
    relatedThreadHref: "/drops/creator-tools/threads",
  },
];

export const audienceSegments = [
  {
    label: "Highly engaged regulars",
    size: "1.8K",
    signal: "High momentum",
    summary:
      "They return multiple times a week, reply to each other, and amplify operational frameworks like meal prep systems.",
    relatedTheme: "Meal prep systems",
    relatedThemeHref: "/drops/creator-tools/themes",
    relatedThreadHref: "/drops/creator-tools/analytics/top-post",
  },
  {
    label: "Reactivated readers",
    size: "19",
    signal: "Returning",
    summary:
      "Previously quiet members are engaging again when the creator answers practical budget and routine questions directly.",
    relatedTheme: "Budget shortcuts",
    relatedThemeHref: "/drops/creator-tools/themes",
    relatedThreadHref: "/drops/creator-tools/nudges/lapsed-reader",
  },
  {
    label: "Caregiver planners",
    size: "640",
    signal: "Needs more depth",
    summary:
      "They save family-oriented posts often, but thread participation drops when follow-up examples do not arrive quickly.",
    relatedTheme: "Family routine hacks",
    relatedThemeHref: "/drops/creator-tools/themes",
    relatedThreadHref: "/drops/creator-tools/threads",
  },
  {
    label: "High-signal question askers",
    size: "37",
    signal: "Decision trigger",
    summary:
      "These readers ask specific implementation questions that tend to turn into high-leverage reply opportunities.",
    relatedTheme: "Meal prep systems",
    relatedThemeHref: "/drops/creator-tools/themes",
    relatedThreadHref: "/drops/creator-tools/nudges/high-signal-question",
  },
];

export const topPosts = [
  {
    title: "How I batch a week of dinners in 90 minutes",
    views: 8400,
    engagement: 6.8,
    href: "/drops/creator-tools/analytics/top-post",
  },
  {
    title: "My no-stress grocery reset template",
    views: 6700,
    engagement: 5.4,
    href: "/drops/creator-tools/threads",
  },
  {
    title: "What I stopped buying to cut our food budget",
    views: 5200,
    engagement: 4.9,
    href: "/drops/creator-tools/nudges/lapsed-reader",
  },
  {
    title: "The Sunday prep ritual my readers keep saving",
    views: 4600,
    engagement: 4.3,
    href: "/drops/creator-tools/threads",
  },
];

export const threadSignals = [
  {
    title: "Meal prep thread with 37 unresolved replies",
    signal: "High-signal question cluster",
    body:
      "Readers are asking for templates, storage rules, and freezer variations. Creator presence would likely extend the thread another cycle.",
    href: "/drops/creator-tools/nudges/high-signal-question",
  },
  {
    title: "Budget shortcuts thread reactivating quiet members",
    signal: "Audience reactivation",
    body:
      "Two previously active readers returned after a direct reply and pulled others into the discussion.",
    href: "/drops/creator-tools/nudges/lapsed-reader",
  },
  {
    title: "Welcome post is no longer carrying top-slot value",
    signal: "Pinning opportunity",
    body:
      "The AMA thread is outperforming the default onboarding pin and may deserve the top slot during the active window.",
    href: "/drops/creator-tools/controls/pins",
  },
];

export const actionQueue = [
  {
    title: "Reply to three unanswered questions",
    note:
      "The meal prep thread is still pulling comments and one creator mention is unresolved.",
    href: "/drops/creator-tools/nudges/high-signal-question",
    source: "Driven by the meal prep systems theme",
  },
  {
    title: "Schedule a follow-up for Thursday at 8:30 AM",
    note:
      "Your highest click-through window is still Tuesday through Thursday morning.",
    href: "/drops/creator-tools/controls/scheduler",
    source: "Supported by the best posting window finding",
  },
  {
    title: "Turn budget shortcuts into the next conversation starter",
    note:
      "That theme is now the second-fastest-growing engagement cluster this week.",
    href: "/drops/creator-tools/nudges/conversation-starter",
    source: "Triggered by returning-reader activity",
  },
];

export const nudgeQueue = [
  {
    label: "High-signal question",
    detail:
      "A reader asked for your freezer meal template and the thread crossed 37 replies.",
    href: "/drops/creator-tools/nudges/high-signal-question",
  },
  {
    label: "Lapsed reader opportunity",
    detail:
      "Three previously active readers engaged again after your last direct reply.",
    href: "/drops/creator-tools/nudges/lapsed-reader",
  },
  {
    label: "Conversation starter",
    detail:
      "Community activity dipped yesterday. Prompt: 'What meal shortcut saves your week?'",
    href: "/drops/creator-tools/nudges/conversation-starter",
  },
];

export const controlsKpis = [
  { label: "Scheduled posts", value: "12", detail: "6 this week, 6 next week" },
  { label: "Pinned posts", value: "3/3", detail: "all slots currently in use" },
  { label: "Team-authored drafts", value: "7", detail: "awaiting creator review" },
  { label: "Hidden posts", value: "4", detail: "kept private without deletion" },
];

export const scheduledPosts = [
  {
    title: "My 5-ingredient breakfast reset",
    status: "Scheduled",
    publishAt: "Tomorrow • 8:30 AM",
    source: "Creator",
    href: "/drops/creator-tools/controls/scheduler",
  },
  {
    title: "Sunday prep Q&A follow-up",
    status: "Awaiting review",
    publishAt: "Thu • 9:00 AM",
    source: "Team",
    href: "/drops/creator-tools/controls/team-review",
  },
  {
    title: "April pantry challenge kickoff",
    status: "Draft",
    publishAt: "Fri • 10:15 AM",
    source: "Team",
    href: "/drops/creator-tools/controls/scheduler",
  },
];

export const pinnedPosts = [
  {
    title: "Start here: welcome to my meal planning community",
    note: "Evergreen orientation post • pinned for 42 days",
  },
  {
    title: "April batch-cooking AMA",
    note: "Active event thread • 218 comments",
  },
  {
    title: "Free printable grocery reset checklist",
    note: "Top converting resource • 12% CTR to blog",
  },
];

export const moderationActions = [
  {
    title: "Hide duplicate promo thread",
    note:
      "Flagged by two moderators. Keeps the main discussion clean without deleting history.",
    href: "/drops/creator-tools/controls/moderation",
  },
  {
    title: "Review team-submitted follow-up copy",
    note:
      "Posted as creator with disclosure enabled. Ready for one-click approval.",
    href: "/drops/creator-tools/controls/team-review",
  },
  {
    title: "Unpin AMA thread on Friday evening",
    note:
      "Schedule pin removal so the onboarding post regains the top slot after the event.",
    href: "/drops/creator-tools/controls/pins",
  },
];

export const postingCalendar = [
  { day: "Mon", slot: "1 scheduled", emphasis: false },
  { day: "Tue", slot: "2 scheduled", emphasis: true },
  { day: "Wed", slot: "Creator review", emphasis: false },
  { day: "Thu", slot: "1 team draft", emphasis: true },
  { day: "Fri", slot: "Promotional post", emphasis: false },
  { day: "Sat", slot: "Open", emphasis: false },
  { day: "Sun", slot: "AMA recap", emphasis: true },
];

export const nudgeKpis = [
  { label: "Nudges sent today", value: "2", detail: "within the default daily cap" },
  { label: "Action rate", value: "34%", detail: "creators replied or scheduled after opening" },
  { label: "Re-engaged readers", value: "19", detail: "returned within 7 days of creator response" },
  { label: "Digest cadence", value: "Daily", detail: "real-time only for high-signal mentions" },
];

export const nudgeInbox = [
  {
    type: "High-signal question",
    title: "Reader asking for your freezer meal template",
    body: "37 replies and a direct creator mention. Likely worth an immediate response.",
    priority: "Respond now",
    href: "/drops/creator-tools/nudges/high-signal-question",
  },
  {
    type: "Lapsed reader",
    title: "Two previously active readers returned to a recent budget thread",
    body: "A direct reply here has strong odds of pulling them back into weekly participation.",
    priority: "Worth a reply",
    href: "/drops/creator-tools/nudges/lapsed-reader",
  },
  {
    type: "Conversation starter",
    title: "Community activity is below your 7-day average",
    body: "Suggested prompt: 'What pantry shortcut saves you the most money each week?'",
    priority: "Post today",
    href: "/drops/creator-tools/nudges/conversation-starter",
  },
];

export const nudgePreferences = [
  { label: "High-signal questions", value: "Real-time + digest" },
  { label: "Lapsed reader opportunities", value: "Digest only" },
  { label: "Conversation starters", value: "Daily at 7:00 AM" },
  { label: "Quiet hours", value: "9:00 PM - 7:00 AM" },
];

export const experimentStats = [
  { label: "Replies triggered", value: "41", note: "from nudges in the last 30 days" },
  { label: "Posts scheduled", value: "9", note: "after conversation starter prompts" },
  { label: "Readers recovered", value: "15%", note: "returned within 7 days" },
];
