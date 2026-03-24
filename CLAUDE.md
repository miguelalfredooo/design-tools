# CLAUDE.md — Carrier Design & Engineering Context

This file is read automatically by Claude Code. Follow these conventions on every session.

---

## Product

Carrier is a private, desktop-only product-design workspace for running research sessions,
synthesizing insights, and reviewing Design Ops outputs in one place.

**Three top-level areas. One surface. Sidebar-driven navigation.**

| Area | Route | Notes |
|---|---|---|
| Sessions | `/` | Create sessions, vote on options, reveal results. |
| Insights | `/research` | Research hub — observations, segments, synthesis, reference. |
| Design Ops | `/design-ops` | Design ops workspace with spine nav, modules, history. |

---

## Navigation pattern

The sidebar (`DesignSidebar`) has three top-level nav items. When **Insights** is active:
- The main nav column collapses to icon-only (`w-16`)
- A secondary `InsightsSubNav` column appears with five sub-sections: Overview, Observations, Segments, Replays, Reference
- Active sub-section is driven by `?tab=` URL param (e.g. `/research?tab=segments`)

---

## Insights — Research Hub

### Data model

| Table | Purpose |
|---|---|
| `research_observations` | Raw UX observations (area, body, contributor, source_url) |
| `research_segments` | User segments (name) |
| `research_segment_items` | Synthesized insights per segment (bucket, title, body, source_observation_ids) |
| `research_share_tokens` | Share token store |

### Bucket types

```ts
type Bucket = "needs" | "pain_points" | "opportunities" | "actionable_insights";
```

Labels defined in `lib/research-hub-types.ts` → `BUCKET_LABELS`.

### Synthesis flow

1. Log observations in Observations tab (or pull from Slack via `npm run slack:sync`)
2. Select observations → Synthesize → Haiku extracts structured insights mapped to segments
3. Route: `POST /api/design/research/observe-synthesize`
4. Each synthesis run **deletes existing items for affected segments** before inserting — never accumulates duplicates

### Slack sync

Script: `scripts/slack-sync.mjs`
Command: `npm run slack:sync -- --channel <name> [--days 7] [--dry-run]`
Requires: `SLACK_BOT_TOKEN` in `.env.local`

---

## Design principles

- **One workspace** — not many routes. The designer never leaves the surface.
- **Summary-first** — default to scannable. Expand on demand.
- **Private by default** — process details, run data, and internal keys are hidden from shared views.
- **Readable labels** — no raw system keys. No wizard-style flows. Plain language everywhere.
- **State always visible** — empty / loading / running / complete — each state is explicit and distinct.

---

## Status model

Four states only. No variants. No custom labels per module.

```ts
export const STATUS = {
  NOT_STARTED: { label: 'Not started', indicator: 'gray'  },
  IN_PROGRESS:  { label: 'In progress', indicator: 'amber' },
  COMPLETE:     { label: 'Complete',    indicator: 'green' },
  BLOCKED:      { label: 'Blocked',     indicator: 'red'   },
} as const;
```

---

## Color tokens (semantic)

```ts
export const TOKENS = {
  // Status indicators
  gray:  '#888780',  // not started
  amber: '#854F0B',  // in progress
  green: '#3B6D11',  // complete
  red:   '#A32D2D',  // blocked

  // Insight card types
  risk:        { bg: '#FCEBEB', text: '#A32D2D' },
  opportunity: { bg: '#EAF3DE', text: '#3B6D11' },
  pattern:     { bg: '#E1F5EE', text: '#0F6E56' },
} as const;
```

---

## Shared view rule

The shared view is a **filtered render** of the same component — never a separate route.

What is visible in the shared view:
- Summary strip (confidence, participants, insight count, recommendation, next steps)
- Top insight cards (type tag + text only — no supporting detail)
- Next steps

What is never visible in the shared view:
- Run-level data
- Internal keys or system labels
- Process notes
- Full working detail

---

## Insight card types

Three types only. Type is always displayed as a colour tag before the text.

| Type | Color | Meaning |
|---|---|---|
| Risk | Red | Something that could cause harm, friction, or failure |
| Opportunity | Green | Something that could be improved or built on |
| Pattern | Teal | Something that recurred across sessions or participants |

---

## States to design for

Every state must be explicit. No blank screens. No bare spinners.

| State | Requirement |
|---|---|
| Empty | Explain why and surface the next action |
| Loading | Show progress with context |
| Running | Indicate analysis in progress with estimated state |
| Complete | Surface results immediately, no expansion required |
| Error | Plain language explanation + recovery path |

---

## Design Ops module requirements

Each module row must display in collapsed state (no expansion required):
- Status indicator dot
- Module name
- Next action (if in progress) or completion date (if complete)
- Blocked reason — one line, plain language (if blocked)

A user must identify which module requires attention within 5 seconds without scrolling.
Modules are not a forced sequence — any module can be opened directly.

---

## What not to build

- Separate pages for Results and Insights — they are one surface
- A separate route for the shared view — it is a filtered render
- Auto-advance on completion — prompt the user, do not navigate for them
- Multiple status label variants — use the four defined states only
- Internal keys or system labels in any user-facing string

---

## Git workflow

Carrier develops directly on `main` — no feature branches, no worktrees.
Remote tracking branch: `origin/carrier-prd-v1-1`

Before pushing:
1. `git fetch origin && git status`
2. Commit all changes
3. `git log HEAD..origin/carrier-prd-v1-1 --oneline` — if not empty, rebase first
4. `git push origin main`

Always read `docs/github-clean-workflow.md` before any git/GitHub task.

### Skill overrides

**SKIP** `superpowers:using-git-worktrees` — do NOT create a worktree or branch. Work on `main`.
**SKIP** worktree/branch setup in `superpowers:subagent-driven-development`, `superpowers:brainstorming`, and `superpowers:writing-plans`.
**SKIP** branch cleanup in `superpowers:finishing-a-development-branch` — push to `main` instead.

---

## Tech stack

- **Framework:** Next.js App Router + TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Icons:** Lucide React
- **LLM:** Anthropic (`claude-haiku-4-5-20251001`) via `@anthropic-ai/sdk` — primary synthesis provider
- **Port:** 3500 (`npm run dev`)
- **Repo:** `https://github.com/cafemedia/design.git` (cafemedia org)
- **Supabase project:** `bwuqbcleoatmtyppaqzm` (work account)

## Key directories

```
app/                   Next.js pages + API routes
  api/design/          Internal API routes
    research/          Observations, segments, synthesis, reference, Slack sync
    sessions/          Voting session management
components/
  design/              Carrier product components
    research/          Insights hub components (overview, observations, segments, etc.)
  ui/                  shadcn/ui primitives
hooks/                 Custom React hooks
lib/                   Utilities, types
  research-hub-types.ts     Observation, Segment, SegmentItem types + bucket labels
  research-dashboard-types.ts  Dashboard data shape for Overview tab
scripts/
  slack-sync.mjs       Slack → research_observations pull script
supabase/
  migrations/          All schema migrations (source of truth)
docs/                  Project documentation
test/                  Node.js built-in test runner (node --test)
```

## Testing

```bash
node --test test/<file>.test.mjs
```
