# Design Ops Simplification

**Date:** 2026-03-17
**Goal:** Lower the barrier for stakeholder participation by reducing cognitive overload across all three steps of the Design Ops flow.

---

## Problem

The current Design Ops section has too much friction for stakeholders:

- The objective form exposes 8+ fields upfront, including internal taxonomy (segments, lifecycle cohorts, stage, type) that stakeholders don't have context for.
- The synthesis step uses jargon ("synthesis depth", "focus prompt for Oracle", "Decision memo") and shows 3 large mode-selection cards before anything has been run.
- Internal agent names (Oracle, Atlas, Beacon, Crew) leak into UI copy and error messages.
- The findings step surfaces internal agent choreography ("Process details") to all users.

---

## Design Decisions

### Structure

Keep the 3-step wizard. Rename step display labels to plain language. The underlying `DesignOpsStep` enum values (`"objective"`, `"synthesis"`, `"findings"`) do not change — only what's rendered in the UI.

| Before | After |
|--------|-------|
| Objective | Objective |
| Synthesis | Run |
| Findings | Results |

---

### Step 1 — Objective

**Required fields (always visible):**
1. Objective title — "What outcome are we trying to move?"
2. Problem / Opportunity — "What's the problem or opportunity?"
3. Primary metric (dropdown)

**Collapsed under "Add context (optional)":**
- Target
- Theory of success
- Stage
- Segments
- Lifecycle cohorts
- Objective type
- Owner

**Rationale:** The three required fields give the synthesis enough signal to produce a focused result. The rest is enrichment for power users who want more precision.

---

### Step 2 — Run

**Depth selector:**
- Replace 3-card selector with a compact segmented toggle: **Quick / Balanced / Deep**
- These are display labels only — the underlying `SynthesisMode` values (`"quick_read"`, `"decision_memo"`, `"deep_dive"`) do not change
- Label mapping: Quick → `quick_read`, Balanced → `decision_memo`, Deep → `deep_dive`
- Default: Balanced (`"decision_memo"` — unchanged from current default)
- Remove "Synthesis depth" label — the toggle is self-explanatory
- Remove mode guidance text below the prompt
- Remove "Deep dive reference prompt" collapsible
- Remove "Use recommended prompt" button — auto-fill handles this already

**Prompt field:**
- Label: "What do you want to understand?" (replaces "Focus prompt")
- Keep auto-fill from objective
- Keep editable

**Run button:**
- Label: "Run analysis" (replaces "Run Decision memo" / "Run Quick read" etc.)

**Language:**
- Remove all internal agent names from UI copy: no "Oracle", "Crew", "Atlas", "Beacon"
- Error toasts: "Add a question to continue" (replaces "Enter a focus prompt for Oracle")
- In-progress state: "Analysis in progress..." (replaces "[Mode] in progress...")

---

### Step 3 — Results

**Synthesis cards:** No structural changes — the card layout (summary, findings, needs) is already clear.

**Section header:**
- "Analysis" (replaces "Live synthesis" / "Current findings")

**Process details:**
- Remove from default view entirely
- Accessible via `?debug=true` query param only — read in `design-ops-timeline.tsx` via `useSearchParams()` on the client
- Not visible to stakeholders under any normal interaction path

**Archive list:** No changes.

---

## Out of Scope

- Changes to the synthesis output format or agent logic
- Changes to the archive or findings dialog
- Mobile layout changes
- Any changes to the Crew service or API

---

## Files Affected

| File | Change |
|------|--------|
| `components/design/design-ops-step-nav.tsx` | Rename step display labels (enum values unchanged) |
| `components/design/design-ops-objective-fields.tsx` | Move optional fields into collapsible group |
| `components/design/design-ops-objectives.tsx` | Minor label updates |
| `components/design/design-ops-crew-runner.tsx` | Replace mode cards with segmented toggle, rename labels, remove agent references |
| `components/design/design-ops-client.tsx` | Rename section headers, hide process details |
| `components/design/design-ops-timeline.tsx` | Gate process details behind `?debug=true` via `useSearchParams()` |
| `hooks/use-design-ops-workspace.ts` | Review only — no changes expected, but verify `canOpenSynthesis`/`canOpenFindings` naming is internal and not surfaced to users |

### Intentional gaps

- `components/design/design-ops-archive-list.tsx` — Archive entries will continue to show old mode labels ("decision memo", "quick read") for historical runs. This is acceptable; retroactive label changes are out of scope.
- `components/design/design-ops-finding-dialog.tsx` — No changes to the findings dialog. Minor label inconsistency with new toggle names is acceptable at this stage.
