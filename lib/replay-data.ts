// Static mock replay data — shared between the page and the synthesis API route

// ── Synthesis response types (used by API route + page) ─────────────────────

export interface ReplayFriction {
  pattern: string;
  frequency: number;
  severity: string;
}

export interface ReplayMatrixItem {
  issue: string;
  effort: string;
  impact: string;
  quadrant: string;
}

export interface ReplaySynthesis {
  frictions: ReplayFriction[];
  matrix: ReplayMatrixItem[];
  takeaway: { title: string; detail: string } | null;
}

// ── Replay data types ───────────────────────────────────────────────────────

export interface ReplayFinding {
  issue: string;
  userImpact: string;
  metricAffected: string;
  effort: string;
}

export interface Replay {
  id: number;
  title: string;
  dateReviewed: string;
  sessionSource: string;
  sessionLength: string;
  userContext: {
    userType: string;
    device: string;
    entryPoint: string;
  };
  whatHappened: string;
  whatWorked: string[];
  frictionPoints: string[];
  findings: ReplayFinding[];
  recommendation: string;
  openQuestions: string[];
}

export const replays: Replay[] = [
  {
    id: 1,
    title: "Member tries to share a post to Instagram Stories",
    dateReviewed: "Feb 28, 2026",
    sessionSource: "Mixpanel",
    sessionLength: "2m 34s",
    userContext: {
      userType: "Active member (32 sessions)",
      device: "iPhone 15 — Safari",
      entryPoint: "Push notification → community post",
    },
    whatHappened:
      "User tapped a push notification about a trending post, read through comments, then hit the share button. They selected 'Instagram Stories' from the share sheet but got a generic link preview with no image or branding. They cancelled, screenshot the post manually, cropped it, and shared that instead.",
    whatWorked: [
      "Push notification deep-linked directly to the post — zero navigation needed",
      "Share sheet appeared quickly with platform options visible",
      "Native iOS share sheet felt familiar and trustworthy",
    ],
    frictionPoints: [
      "Instagram Stories share produced a plain URL card — no visual preview, no community branding",
      "No option to generate a branded share image or quote card",
      "User had to leave the app entirely to screenshot-crop-share — 6 extra steps",
      "No tracking on whether the manual share actually drove any clicks back",
    ],
    findings: [
      {
        issue: "No branded share images for Stories",
        userImpact: "High — members won't share ugly link cards",
        metricAffected: "Organic share rate",
        effort: "Medium",
      },
      {
        issue: "No quote-card generator",
        userImpact: "High — screenshot workaround is too many steps",
        metricAffected: "Share completion rate",
        effort: "Medium",
      },
      {
        issue: "Share attribution lost on manual screenshots",
        userImpact: "Medium — can't measure viral loops",
        metricAffected: "Referral tracking",
        effort: "Small",
      },
    ],
    recommendation:
      "Build a 'Share as Image' option that generates a branded quote card (post excerpt + community logo + QR code) optimized for Instagram Stories dimensions (1080x1920).",
    openQuestions: [
      "What percentage of shares go to Instagram vs. other platforms?",
      "Should the quote card be customizable (background color, font) or fixed to community brand?",
      "Do creators want to approve how their posts appear when shared visually?",
    ],
  },
  {
    id: 2,
    title: "Creator struggles with the post composer on mobile",
    dateReviewed: "Feb 25, 2026",
    sessionSource: "Mixpanel",
    sessionLength: "6m 51s",
    userContext: {
      userType: "Creator (47 posts published)",
      device: "Samsung Galaxy S24 — Chrome",
      entryPoint: "Email digest → community home → compose",
    },
    whatHappened:
      "Creator opened a weekly digest email, tapped through to the community home, then hit the compose button. They typed a 3-paragraph post, tried to add an image from their gallery, and the composer lost their draft when the image picker opened. They retyped a shorter version, skipped the image, and posted. Total time from intent to publish: nearly 7 minutes for what should have been 2.",
    whatWorked: [
      "Email deep link landed on community home without requiring re-auth",
      "Compose button was immediately visible above the feed",
      "Text formatting toolbar (bold, italic, link) worked correctly",
    ],
    frictionPoints: [
      "Draft lost when image picker opened — no auto-save or state persistence",
      "Image picker triggered a full page navigation on Android Chrome instead of an overlay",
      "No confirmation before navigating away from an unsaved draft",
      "No way to attach multiple images — single image only, no carousel",
      "Keyboard covered the formatting toolbar on smaller screens",
    ],
    findings: [
      {
        issue: "No draft auto-save",
        userImpact: "Critical — users lose entire posts",
        metricAffected: "Post completion rate",
        effort: "Small",
      },
      {
        issue: "Image picker navigates away on Android",
        userImpact: "High — directly causes draft loss",
        metricAffected: "Posts with media %",
        effort: "Medium",
      },
      {
        issue: "No unsaved changes warning",
        userImpact: "High — no safety net for accidental navigation",
        metricAffected: "Post completion rate",
        effort: "Small",
      },
      {
        issue: "Formatting toolbar hidden by keyboard",
        userImpact: "Medium — forces dismiss-format-reopen cycle",
        metricAffected: "Rich post formatting usage",
        effort: "Medium",
      },
    ],
    recommendation:
      "Ship draft auto-save immediately (localStorage with debounce) — it's the single highest-impact fix. Then address the Android image picker with an in-app overlay.",
    openQuestions: [
      "How many started-but-not-published posts do we see per week?",
      "Is the image picker issue Android-specific or does it also affect older iOS versions?",
      "Would a 'scheduled post' feature reduce the pressure to compose quickly on mobile?",
    ],
  },
  {
    id: 3,
    title: "New member arrives from email invite — onboarding confusion",
    dateReviewed: "Feb 21, 2026",
    sessionSource: "Mixpanel",
    sessionLength: "3m 18s",
    userContext: {
      userType: "First-time visitor",
      device: "Pixel 8 — Chrome",
      entryPoint: "Email invite link → /join",
    },
    whatHappened:
      "User received a personal invite email from a creator they follow on Instagram. They tapped the link, landed on the join page, and created an account. After sign-up, they were dropped on a generic community home feed with no context about why they were invited or what to do first. They scrolled the feed passively for 40 seconds, then left without interacting.",
    whatWorked: [
      "Email-to-signup flow was fast — 3 taps to account creation",
      "Sign-up form was minimal (name, email, password) — no unnecessary fields",
      "Page loaded quickly on mobile data connection",
    ],
    frictionPoints: [
      "No personalized welcome referencing the creator who invited them",
      "Post-signup landing was generic feed — no guided first action",
      "No prompt to follow the inviting creator or introduce themselves",
      "Push notification permission was requested immediately with no context — user declined",
      "No 'add to home screen' prompt to establish the app as a habit",
    ],
    findings: [
      {
        issue: "No personalized post-signup experience",
        userImpact: "High — first impression is generic and cold",
        metricAffected: "Day-1 retention",
        effort: "Medium",
      },
      {
        issue: "No guided first action",
        userImpact: "High — new members don't know what to do",
        metricAffected: "Activation rate (first post/comment)",
        effort: "Medium",
      },
      {
        issue: "Push permission asked too early",
        userImpact: "Medium — one-shot permission burned with no value shown",
        metricAffected: "Push opt-in rate",
        effort: "Small",
      },
      {
        issue: "No entry point context preserved",
        userImpact: "Medium — invite relationship lost after signup",
        metricAffected: "Creator-member connection rate",
        effort: "Small",
      },
    ],
    recommendation:
      "After sign-up from an invite link, show a welcome screen that says 'You were invited by [Creator Name]' with a follow button and a suggested first action ('Say hello in the welcome thread').",
    openQuestions: [
      "What percentage of new signups come from invite links vs. organic?",
      "How does Day-1 retention differ between invited vs. organic members?",
      "Should we A/B test different first actions (follow, comment, introduce)?",
    ],
  },
];

export const synthesis = {
  sessionsReviewed: 3,
  totalFriction: 14,
  criticalIssues: 4,
  themes: [
    {
      area: "Sharing",
      color: "bg-violet-500",
      summary: "Members want to share but the output is ugly — they screenshot instead of using native share.",
      topIssue: "No branded share images",
      impact: "High",
    },
    {
      area: "Post Composer",
      color: "bg-amber-500",
      summary: "Drafts are lost on mobile when the image picker opens. No auto-save, no warning.",
      topIssue: "Draft loss on navigation",
      impact: "Critical",
    },
    {
      area: "Entry Points",
      color: "bg-sky-500",
      summary: "New members from email/push land on a generic feed with no personalization or guided action.",
      topIssue: "No post-signup onboarding",
      impact: "High",
    },
  ],
  quickWins: [
    "Draft auto-save (localStorage)",
    "Unsaved changes warning",
    "Preserve invite context after signup",
    "Delay push permission request",
  ],
  bigBets: [
    "Branded quote-card generator for social sharing",
    "Personalized welcome flow per entry point",
    "Creator-aware onboarding sequence",
  ],
  openThreads: [
    "What % of shares go to Instagram vs. other platforms?",
    "How many drafts are started but never published?",
    "Day-1 retention by entry point (email vs. push vs. Instagram)?",
  ],
};

/** Format all replay data as a text prompt for Ollama */
export function formatReplaysForPrompt(): string {
  return replays
    .map((r) => {
      const findingLines = r.findings
        .map(
          (f) =>
            `    - Issue: ${f.issue} | Impact: ${f.userImpact} | Metric: ${f.metricAffected} | Effort: ${f.effort}`
        )
        .join("\n");

      return [
        `REPLAY ${r.id}: "${r.title}"`,
        `  Date: ${r.dateReviewed} | Source: ${r.sessionSource} | Length: ${r.sessionLength}`,
        `  User: ${r.userContext.userType} on ${r.userContext.device}`,
        `  Entry: ${r.userContext.entryPoint}`,
        ``,
        `  What happened: ${r.whatHappened}`,
        ``,
        `  What worked:`,
        r.whatWorked.map((w) => `    + ${w}`).join("\n"),
        ``,
        `  Friction points:`,
        r.frictionPoints.map((f) => `    - ${f}`).join("\n"),
        ``,
        `  Findings:`,
        findingLines,
        ``,
        `  Recommendation: ${r.recommendation}`,
        ``,
        `  Open questions:`,
        r.openQuestions.map((q) => `    ? ${q}`).join("\n"),
      ].join("\n");
    })
    .join("\n\n---\n\n");
}
