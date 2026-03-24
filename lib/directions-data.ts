export interface DesignDirection {
  id: string;
  title: string;
  source: string;
  problem: string;
  idea: string;
  why: string;
  risk: string;
  metric?: string; // KPI this direction is intended to move
  moduleRef?: string; // Design Ops module it informs
}

export const directions: DesignDirection[] = [
  {
    id: "engagement-mirror",
    title: "A weekly digest showing creators which posts actually drove results",
    source: "Outside-In Alignment — Kalbach, Mapping Experiences",
    problem: "Creators publish without feedback loops — they have no visibility into which posts drive real engagement or pageviews.",
    idea: 'A weekly digest card that surfaces 3 posts ranked by a composite score (replies + pageviews + conversions), with a plain-language annotation like "This post drove 4x more replies than your average." Tapping any post shows a simple engagement curve vs. the creator\'s median. The data comes to the creator — no dashboard to navigate.',
    why: "Organizations default to inside-out thinking — building without first understanding what the user is experiencing. The digest forces an outside-in shift by making the reader's behavior legible without requiring creators to become analysts.",
    risk: "Scoring model must be carefully designed — optimize for wrong signals and creators shift toward sensationalism.",
    metric: "Pageviews per session · Creator DAU/WAU",
    moduleRef: "Performance Dashboard",
  },
  {
    id: "silence-clock",
    title: "An early warning that surfaces before creator silence starts costing readers",
    source: "Product Lifecycle Stages — Abraham, My PM Toolkit",
    problem: "Creator silence measurably increases reader churn, but creators have no signal that their absence is becoming dangerous.",
    idea: 'An ambient indicator visible only to the creator — neutral at first, reads "Readers are waiting" at day 10. At day 16 it surfaces one contextual nudge generated from their own highest-performing content: "Your post about [topic] got 34 replies — want to pick up that thread?" Tapping opens a pre-populated reply draft.',
    why: "Every product relationship has a lifecycle with detectable inflection points. Intervening at day 10 is a stage-transition move — not a panic response. The creator gets a reason to act, not just a guilt trip.",
    risk: "If the generated prompt feels off-brand or generic, it reads as surveillance rather than support and damages trust.",
    metric: "Creator posting frequency · Reader retention rate",
    moduleRef: "Engagement Prompts",
  },
  {
    id: "signal-filter",
    title: "A notification filter that only surfaces conversations worth a creator's time",
    source: "Identifying Touchpoints — Kalbach, Mapping Experiences, Ch. 2",
    problem: "Notification volume drowns signal — creators miss the conversations actually worth their time.",
    idea: 'Notifications sorted into two buckets: "Worth your time" (max 3, ranked by thread depth, subscriber status, and prior engagement history) and "Everything else" (collapsed behind a secondary tap). Each card shows a one-line excerpt and a reply shortcut that opens directly to that specific comment.',
    why: "Not all touchpoints carry equal value. The ones that matter are the ones that move the relationship forward. Applying that distinction to notification design makes the platform a curator of the creator's attention rather than a firehose.",
    risk: "The scoring model must be transparent — any suspicion it's burying paying subscribers or suppressing topics kills adoption permanently.",
    metric: "Creator reply rate · Notification opt-out rate",
    moduleRef: "Engagement Prompts",
  },
  {
    id: "byline-system",
    title: "A team posting model that lets creators delegate without losing reader trust",
    source: "Problem-First Thinking — Abraham, My PM Toolkit, Ch. 1",
    problem: "Team members post under their own identity, confusing readers and breaking the coherence of the creator's voice.",
    idea: 'Three attribution modes: "On behalf of [Creator]" (creator name with contributor tag on hover), "Co-authored with [Creator]" (shared byline), or "From the [Newsletter] team" (collective identity). Solo team posts require one-tap creator approval, surfaced as a single daily card in the creator\'s mobile inbox. Approved posts go live instantly.',
    why: "Starting with the customer's problem rather than the operational constraint changes the entire solution shape. The real problem isn't team members needing access — it's readers needing a coherent identity to subscribe to. Solve that first and the workflow falls into place.",
    risk: "High-volume teams need a trust-level setting that pre-approves certain team members for specific post types — not every post should require approval.",
    metric: "Posts published per week · Reader unsubscribe rate",
    moduleRef: "Team Posting with Attribution",
  },
  {
    id: "reentry-hook",
    title: "A re-entry point that drops lapsed readers back into a live conversation",
    source: "Value Alignment — Kalbach, Mapping Experiences, Ch. 9",
    problem: "Lapsed readers leave silently with no recovery path — once gone, there is no re-engagement mechanism.",
    idea: 'At 21 days of inactivity, the next time the reader visits any Raptive property they see: "You haven\'t read [Creator] in a while. This post from last week has 47 replies and people are still talking." The CTA is a direct link into a live thread — not "resubscribe," just a door back into an active conversation mid-stream.',
    why: "Re-engagement fails when it asks people to recommit before they've re-experienced value. A lapsed reader's blocker isn't forgetting to subscribe — it's that the community stopped feeling live. Dropping them into an active thread restores that feeling before asking for anything.",
    risk: "Requires accurate engagement data. If the surfaced thread is quiet, the message confirms the community is dead rather than reviving interest.",
    metric: "Lapsed reader reactivation rate · Sessions per community",
    moduleRef: "Lapsed Reader Signals",
  },
  {
    id: "mobile-reply",
    title: "A standalone mobile reply experience that works in two taps from any notification",
    source: "Features That Work Together — Abraham, My PM Toolkit, Ch. 1",
    problem: "Mobile posting is non-functional — creators cannot reply from their phones at all.",
    idea: 'A standalone "Reply Mode" — a bottom-sheet triggered from any notification — with the quoted comment, plain text input, and exactly three actions: Reply, Boost, Dismiss. No formatting toolbar, no navigation away. Two taps from any notification. Auto-saves as draft if the creator navigates away mid-reply.',
    why: "A great product isn't a list of features — it's how they fit together. The current failure is a coherence failure: the full desktop posting model was ported to mobile without rethinking the interaction. Reply is a distinct behavior from composing. Treating it that way restores the fit.",
    risk: "Creators who want to add images or formatting on mobile will feel constrained — needs a clear escape hatch to full compose without losing the draft.",
    metric: "Mobile reply rate · Creator DAU on mobile",
    moduleRef: "Creator Research — Sprint 0",
  },
  {
    id: "prompt-budget",
    title: "A weekly cap on platform prompts that keeps creators receptive instead of fatigued",
    source: "Avoiding the Build Trap — Perri, via Abraham, My PM Toolkit",
    problem: "Engagement prompts risk fatigue — if cadence is wrong at launch, creators will train themselves to ignore the interface entirely.",
    idea: 'Each creator has a weekly prompt cap (default: 2) across all prompt types. The system queues by priority and holds lower-priority prompts for the following week rather than stacking. Exposed as a single slider labeled "How often should we check in with you?" — not a notifications settings screen.',
    why: "Shipping a feature because it seems useful without asking whether it solves the right problem is how trust gets eroded. The right problem here isn't getting creators to engage more — it's keeping them receptive so that when a prompt fires, they act on it. Attention is finite. Treat it that way.",
    risk: "Two per week may be too conservative for lapsing creators who need more intervention — the default should be segment-aware.",
    metric: "Prompt click-through rate · Creator posting frequency",
    moduleRef: "Engagement Prompts",
  },
];
