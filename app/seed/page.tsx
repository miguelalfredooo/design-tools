"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const CREATOR_TOKENS_KEY = "design-creator-tokens";

async function api(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `API ${res.status}`);
  return data;
}

async function apiPatch(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `API ${res.status}`);
  return data;
}

function saveCreatorToken(sessionId: string, token: string) {
  try {
    const existing = JSON.parse(
      localStorage.getItem(CREATOR_TOKENS_KEY) ?? "{}"
    );
    existing[sessionId] = token;
    localStorage.setItem(CREATOR_TOKENS_KEY, JSON.stringify(existing));
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────
// Session 1 — REVEALED: full results
// ─────────────────────────────────────────────────────────────────────

async function seedRevealed(setStatus: (s: string) => void): Promise<string> {
  setStatus("Creating Pricing Page session...");
  const creatorToken = crypto.randomUUID();

  const { id: sessionId } = await api("/api/design/sessions", {
    title: "Pricing Page Redesign",
    description:
      "Four directions for the new SaaS pricing page. Each takes a different approach to layout, hierarchy, and conversion strategy.",
    participantCount: 7,
    previewUrl: "https://alfredo.studio",
    problem:
      "Current pricing page has a 1.2% conversion rate — below our 3% target. Users report confusion about tier differences and hidden costs.",
    goal:
      "Increase free-to-paid conversion to 3%+ while reducing support tickets about pricing by 50%.",
    audience:
      "B2B SaaS buyers — product managers and engineering leads evaluating tools for their team (5-50 seats).",
    constraints:
      "Must support 3 tiers (Starter, Pro, Enterprise). Annual/monthly toggle required. Enterprise needs 'Contact Sales' CTA.",
    creatorToken,
    options: [
      {
        title: "Horizontal Cards",
        description:
          "Three equal-width cards in a row with a highlighted 'Most Popular' badge on Pro. Minimal design focused on feature comparison.",
        mediaType: "image",
        mediaUrl: "https://picsum.photos/seed/pricing-horiz/800/500",
        rationale:
          "Industry standard layout. Low cognitive load, easy left-to-right scanning.",
      },
      {
        title: "Stacked Accordion",
        description:
          "Vertical layout with expandable tier sections. Compact above the fold, details on demand. Mobile-first.",
        mediaType: "image",
        mediaUrl: "https://picsum.photos/seed/pricing-stack/800/500",
        rationale:
          "No horizontal scrolling on mobile. Users focus on one tier at a time.",
      },
      {
        title: "Interactive Calculator",
        description:
          "Slider-based pricing adjusting in real-time by team size and usage. Shows exact cost before committing.",
        mediaType: "image",
        mediaUrl: "https://picsum.photos/seed/pricing-calc/800/500",
        rationale:
          "Addresses the #1 support ticket: 'How much will it cost?' Turns pricing into an interactive experience.",
      },
      {
        title: "Comparison Table",
        description:
          "Full-width feature matrix with sticky headers. Inspired by Notion and Linear.",
        mediaType: "figma-embed",
        mediaUrl:
          "https://www.figma.com/file/example/Pricing-Comparison-Table",
        rationale:
          "Best for power users comparing every feature. Higher density, but risks overwhelming casual visitors.",
      },
    ],
  });

  saveCreatorToken(sessionId, creatorToken);

  // Start voting
  await apiPatch(`/api/design/sessions/${sessionId}`, {
    creatorToken,
    phase: "voting",
  });

  // Fetch option IDs
  const sessionData = await fetch(`/api/design/sessions/${sessionId}`).then(
    (r) => r.json()
  );
  const optionIds: string[] = sessionData.options.map(
    (o: { id: string }) => o.id
  );

  // Cast 7 votes — spread across all 4 options
  setStatus("Casting votes...");
  const voters = [
    { voterId: crypto.randomUUID(), voterName: "Alice Chen", optionIndex: 2 },
    { voterId: crypto.randomUUID(), voterName: "Marcus Johnson", optionIndex: 0 },
    { voterId: crypto.randomUUID(), voterName: "Priya Sharma", optionIndex: 2 },
    { voterId: crypto.randomUUID(), voterName: "David Kim", optionIndex: 0 },
    { voterId: crypto.randomUUID(), voterName: "Sarah Martinez", optionIndex: 1 },
    { voterId: crypto.randomUUID(), voterName: "Leo Tanaka", optionIndex: 3 },
    { voterId: crypto.randomUUID(), voterName: "Nina Okafor", optionIndex: 2 },
  ];

  for (const voter of voters) {
    await api(`/api/design/sessions/${sessionId}/votes`, {
      optionId: optionIds[voter.optionIndex],
      voterId: voter.voterId,
      voterName: voter.voterName,
    });
  }

  // Force reveal
  await apiPatch(`/api/design/sessions/${sessionId}`, {
    creatorToken,
    phase: "revealed",
  });

  return sessionId;
}

// ─────────────────────────────────────────────────────────────────────
// Session 2 — VOTING: mid-vote, 3 of 5 voted
// ─────────────────────────────────────────────────────────────────────

async function seedVoting(setStatus: (s: string) => void): Promise<string> {
  setStatus("Creating Onboarding Flow session...");
  const creatorToken = crypto.randomUUID();

  const { id: sessionId } = await api("/api/design/sessions", {
    title: "Onboarding Flow",
    description:
      "Three approaches to the first-run experience. Goal: reduce drop-off between signup and first value moment.",
    participantCount: 5,
    problem:
      "40% of signups never complete onboarding. The current wizard has 6 steps and feels overwhelming.",
    goal:
      "Get 80%+ of new users to their first 'aha moment' within 2 minutes of signing up.",
    audience:
      "Non-technical users signing up from marketing site. Mix of solo users and small team leads.",
    constraints:
      "Must collect company name + role. Cannot skip email verification. Works on mobile.",
    creatorToken,
    options: [
      {
        title: "Progressive Disclosure",
        description:
          "Minimal first screen — just email + password. Everything else collected gradually through in-app prompts over the first week.",
        mediaType: "image",
        mediaUrl: "https://picsum.photos/seed/onboard-prog/800/500",
        rationale:
          "Lowest friction to start. Risk: users miss important setup steps if prompts are dismissed.",
      },
      {
        title: "Guided Tour",
        description:
          "Interactive walkthrough highlighting key features with tooltip bubbles. User completes real actions (not a simulation).",
        mediaType: "image",
        mediaUrl: "https://picsum.photos/seed/onboard-tour/800/500",
        rationale:
          "Learning by doing. Research shows interactive tutorials have 3x better retention than passive video.",
      },
      {
        title: "Template Picker",
        description:
          "Skip the blank slate — users choose a pre-built template matching their use case. Immediate value, customize later.",
        mediaType: "image",
        mediaUrl: "https://picsum.photos/seed/onboard-template/800/500",
        rationale:
          "Fastest path to value. Notion and Figma both use this pattern successfully.",
      },
    ],
  });

  saveCreatorToken(sessionId, creatorToken);

  // Start voting
  await apiPatch(`/api/design/sessions/${sessionId}`, {
    creatorToken,
    phase: "voting",
  });

  // Fetch option IDs
  const sessionData = await fetch(`/api/design/sessions/${sessionId}`).then(
    (r) => r.json()
  );
  const optionIds: string[] = sessionData.options.map(
    (o: { id: string }) => o.id
  );

  // Cast only 3 of 5 votes to show mid-voting state
  const partialVoters = [
    { voterId: crypto.randomUUID(), voterName: "Elena Voss", optionIndex: 1 },
    { voterId: crypto.randomUUID(), voterName: "James Park", optionIndex: 2 },
    { voterId: crypto.randomUUID(), voterName: "Fatima Al-Rashid", optionIndex: 1 },
  ];

  for (const voter of partialVoters) {
    await api(`/api/design/sessions/${sessionId}/votes`, {
      optionId: optionIds[voter.optionIndex],
      voterId: voter.voterId,
      voterName: voter.voterName,
    });
  }

  // Leave in voting phase (3/5 voted — shows progress bar)
  return sessionId;
}

// ─────────────────────────────────────────────────────────────────────
// Session 3 — SETUP: ready to configure, no votes yet
// ─────────────────────────────────────────────────────────────────────

async function seedSetup(setStatus: (s: string) => void): Promise<string> {
  setStatus("Creating Dashboard Widgets session...");
  const creatorToken = crypto.randomUUID();

  const { id: sessionId } = await api("/api/design/sessions", {
    title: "Dashboard Widget Style",
    description:
      "Choosing the visual direction for analytics dashboard widgets. Impacts the entire dashboard feel.",
    participantCount: 4,
    problem:
      "Current dashboard looks dated — plain tables with no visual hierarchy. Users say it's hard to spot trends at a glance.",
    goal: "Ship a refreshed dashboard that scores 4+ on a 5-point design satisfaction survey.",
    audience: "Data analysts and team managers who check dashboards daily.",
    constraints:
      "Must render 50+ widgets without performance issues. Accessible (WCAG AA). Dark and light mode.",
    creatorToken,
    options: [
      {
        title: "Glassmorphism Cards",
        description:
          "Frosted glass cards with subtle blur backgrounds, layered depth, and soft shadows. Modern and premium feel.",
        mediaType: "image",
        mediaUrl: "https://picsum.photos/seed/dash-glass/800/500",
        rationale:
          "Trending aesthetic that adds depth without clutter. Works well for both light and dark modes.",
      },
      {
        title: "Flat Minimal",
        description:
          "Clean flat cards with bold typography and accent color borders. No shadows, no gradients — pure content focus.",
        mediaType: "image",
        mediaUrl: "https://picsum.photos/seed/dash-flat/800/500",
        rationale:
          "Fastest to render, best accessibility. Timeless design that won't feel dated in 2 years.",
      },
    ],
  });

  saveCreatorToken(sessionId, creatorToken);

  // Stay in setup phase — shows creator controls, participant count stepper, Add Option button
  return sessionId;
}

// ─────────────────────────────────────────────────────────────────────
// Orchestrator
// ─────────────────────────────────────────────────────────────────────

async function seedResearch(setStatus: (s: string) => void) {
  setStatus("Seeding research data (observations, segments, insights)...");
  const res = await fetch("/api/design/research/seed", { method: "POST" });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Research seed failed");
  }
}

async function seedAll(
  setStatus: (s: string) => void
): Promise<string> {
  const revealedId = await seedRevealed(setStatus);
  await seedVoting(setStatus);
  await seedSetup(setStatus);
  await seedResearch(setStatus);

  // Return the revealed session as the redirect target (most interesting)
  return revealedId;
}

export default function SeedPage() {
  const [status, setStatus] = useState("Preparing demo...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    seedAll(setStatus)
      .then((sessionId) => {
        setStatus("Done! Redirecting...");
        window.location.href = `/explorations/${sessionId}`;
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to seed");
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {error ? (
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Seed failed</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <a
            href="/"
            className="text-sm text-primary hover:underline"
          >
            Home
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">{status}</p>
        </div>
      )}
    </div>
  );
}
