# Product Brief: Design Ops — Information Architecture & Visual Hierarchy Redesign

**Version:** 0.1
**Date:** 2026-03-17
**Owner:** Miguel Arias, Product Designer
**Status:** Draft

---

## 1. Problem Statement

> The Design Ops workspace presents all content at the same visual weight — form fields, labels, results, and navigation blend together with no clear hierarchy, making it hard to get bite-size information at a glance and understand what step you're on or what matters most.

---

## 2. Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Reduce cognitive load per screen | Subjective clarity rating (self-assessed) | Feels immediately scannable |
| Surface status at a glance | Status visible without expanding any section | All 3 modules show status when collapsed |
| Keep objective context present during run | Objective visible while configuring a run | No navigation required |
| Metrics and context readable without decoding | All metric/segment values displayed as human-readable labels | Zero underscore keys visible in UI |

---

## 3. Users

**Primary:** Miguel Arias — solo product designer using this tool daily to run AI synthesis against a single active business objective. Works through Objective → Run → Results in sequence but often returns to re-read results or switch objectives.

**Secondary:** Product managers and CPOs who access the shared (non-local) Results view to review findings and recommendations without running analyses themselves.

**Key insight:** The tool is used in focused work sessions — the primary user knows what they're doing, so the UI should optimize for speed and scannability over discoverability.

---

## 4. Scope

**In:**
- Redesign the layout and visual hierarchy of all three steps: Objective, Run Analysis, Results
- Replace the 3-step wizard navigation with a single-page modular layout (3 collapsible sections)
- Fix information density: larger text, stronger contrast, clear label hierarchy
- Replace all metric/segment/cohort underscore keys with human-readable labels
- Retain existing previous objectives list (already inside `DesignOpsObjectives`) — no content moves, just wrap in a collapsible module
- Retain existing previous runs (archive) inside the Results module

**Out:**
- Changes to the Python crew service or SSE streaming logic
- Changes to the shared (public) Results view layer — `DesignOpsFindingsSummary` stays as-is for now
- New features (new sections, new synthesis modes, new agent types)
- Mobile layout — this is a desktop-only tool

**Open questions:**
- Should the page auto-open the first incomplete module on load, or always open Objective by default?
- Should there be any visual indication of which module was most recently updated?

---

## 5. Information Architecture

> Single scrollable page with three collapsible modules. No wizard navigation. Each module is self-contained and independently expandable.

### 5.1 Navigation Model

Linear, single-page. The 3-step tab navigator (`DesignOpsStepNav`) is removed. All three modules are always visible on the page. The user expands and collapses sections as needed. Default state: Objective open, Run and Results collapsed.

### 5.2 Content Hierarchy

```
Design Ops (page)
├── Objective (collapsible module)
│   ├── [collapsed] → title pill, metric label pill, "N previous" pill
│   └── [expanded]
│       ├── "What outcome are we trying to move?" → objective title (large, bold)
│       ├── "Problem / Opportunity" → description body text
│       ├── Context block (metric label, segment name, user stage name)
│       ├── "Add context (optional)" toggle → target, theory of success
│       ├── Save / New objective actions
│       ├── Separator
│       └── Previous objectives list
│           └── [each] title, metric + segment meta, Load button, Delete icon
│
├── Run Analysis (collapsible module)
│   ├── [collapsed] → mode pill, prompt snippet pill
│   └── [expanded]
│       ├── Mode tabs: Quick / Balanced / Deep + description line
│       ├── "What do you want to understand?" → textarea
│       ├── Active objective reference chip (green dot + title)
│       └── Run analysis button
│
└── Results (collapsible module)
    ├── [collapsed] → recommendation snippet pill, phase pill, "N runs" pill
    └── [expanded]
        ├── Signal row: Confidence badge + Phase badge
        ├── Recommendation
        ├── Top findings (bulleted list)
        ├── Next steps
        ├── Separator
        └── Previous runs list
            └── [each] file icon, title, confidence badge, date
```

### 5.3 Key User Flows

1. **Set objective and run analysis** — Open page (Objective expanded) → fill fields → Save → expand Run Analysis → confirm prompt → Run analysis → expand Results to read synthesis
2. **Switch objective and re-run** — Expand Objective → click Load on a previous objective → expand Run Analysis → adjust prompt → Run analysis
3. **Review past results** — Open page → expand Results → scroll previous runs list → click to open archived run

---

## 6. UX Requirements

### 6.1 Core Interactions

- Clicking a module header toggles expand/collapse; chevron rotates 180° when open
- Active module icon inverts (white icon on dark background) to signal focus
- Collapsed state always shows a summary of the section's current content as pills
- "Add context (optional)" is a secondary toggle inside Objective — collapsed by default, opens inline
- Mode tabs update a description line below to explain the selected mode
- Run button is full-width and disabled when objective or prompt is empty
- Previous objectives and runs are scrollable if list grows long

### 6.2 States & Edge Cases

| State | Behavior |
|---|---|
| No objective set | Objective module shows empty state inside; Run module badge reads "Waiting" (disabled); Results module badge reads "No results" |
| Objective set, no run yet | Run module badge reads "Ready"; Results module badge reads "No results" |
| Run in progress | Run module badge reads "Running" with spinner; Run button replaced with "Analysis in progress…" + spinner |
| Run complete | Results module badge updates to confidence level; Results module opens automatically |
| Run Analysis collapsed, no prompt entered | Collapsed summary shows only the mode pill; no prompt pill shown |
| No previous objectives | Previous objectives subheader hidden entirely |
| No previous runs | Previous runs subheader hidden entirely |

### 6.3 Accessibility

- WCAG AA minimum
- All interactive elements keyboard-navigable (Tab, Enter, Space)
- Chevron rotation conveyed via `aria-expanded` on the trigger button
- Badge color is never the sole indicator of status — always paired with text label

---

## 7. UI Requirements

### 7.1 Design System Reference

shadcn/ui component library (already installed in Carrier). Lucide React icons. Tailwind CSS v4. Light mode only for this feature.

### 7.2 Components Needed

| Component | Status | Notes |
|---|---|---|
| Collapsible (shadcn) | **Not installed** — add via `npx shadcn@latest add collapsible` | Replaces custom step wizard; use `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` |
| Card | Existing | Wrap each module |
| Badge | Existing | Status badges on module headers; confidence/phase in results |
| Button (default, outline, ghost, icon) | Existing | Save, New, Load, Delete, Run actions |
| Mode selector (Quick / Balanced / Deep) | Existing (custom pill group) | Already implemented in `DesignOpsCrewRunner` as plain `<button>` elements — do not replace with shadcn Tabs |
| Textarea | Existing | Prompt input |
| Separator | Existing | Divider between active and previous content inside modules |

### 7.3 Visual Constraints

- Desktop-only; no breakpoint changes needed
- Light mode — use the app's existing light theme CSS tokens
- High contrast: `--foreground` on `--background`; module borders darken when open
- Metric/segment/cohort values must always use human-readable labels from `growthMetricOptions`, `designOpsSegments`, `lifecycleCohortOptions` — never raw underscore keys
- Section label text: `text-xs font-semibold uppercase tracking-widest text-muted-foreground`
- Module title: `text-sm font-semibold`
- Field titles (objective name): `text-lg font-bold`
- Body text: `text-sm text-muted-foreground`

---

## 8. Content & UX Writing

- Module names: **Objective**, **Run Analysis**, **Results** (title case, no icons in labels)
- Field label for objective title: "What outcome are we trying to move?"
- Field label for objective description: "Problem / Opportunity"
- Context toggle: "Add context (optional)" / "Hide context"
- Prompt label: "What do you want to understand?"
- Run button: "Run analysis" (idle) / "Analysis in progress…" (running)
- Status badges: Active · Ready · Waiting · Running · High confidence · Medium confidence · Low confidence · No results
- Phase badges (agent-determined): Learning phase · Scaling phase · Expansion phase · Optimization phase
- Collapsed summary: show title truncated to 1 line, metric label, segment count or name
- Empty state for Objective section: "No objective set. Add one to get started."
- Empty state for Results section: "Run an analysis to see results here."

---

## 9. Technical Constraints

- `DesignOpsStepNav` is removed entirely. The `activeStep` state (`"objective" | "synthesis" | "findings"`) and `setActiveStep` in `DesignOpsClient` are deleted — the exact step values to remove are `"objective"`, `"synthesis"`, and `"findings"`.
- `canOpenSynthesis` and `canOpenFindings` gate logic moves from nav to module badge/disabled state (e.g., Run module header badge reads "Waiting" and chevron is non-interactive until an objective is set).
- The `useDesignOpsWorkspace` hook continues to own all data state; the layout restructuring is presentational only.
- Metric/segment/cohort label resolution requires a lookup helper mapping raw values (e.g., `"pvs_per_member_visitor"`) to labels (e.g., `"Page views / member visitor"`) using the arrays in `lib/mock/design-ops-growth-context.ts`.
- The Results module expanded content (Confidence, Recommendation, Top Findings, Next Steps) is rendered by the **existing `DesignOpsFindingsSummary` component** — it is not being rebuilt. The restructuring wraps it in a collapsible module with a header and status badge.
- The Phase badge in the Results module header is extracted from the synthesis body using `extractSection(synthesis.body, "PHASE")` from `lib/design-ops-formatting.ts`. No new field on `AgentMessage` is needed.
- The "Private view" badge (shown when `local === true`) moves to the Results module header, rendered next to the confidence badge. This resolves the open item from Section 12.
- The previous objectives list is **already rendered inside `DesignOpsObjectives`** (lines 160–204 of `design-ops-objectives.tsx`) — no content needs to move. The work is wrapping `DesignOpsObjectives` in a collapsible module.
- The shared/private Results split (`local` param → `DesignOpsFindingsSummary` vs `DesignOpsTimeline`) is preserved within the Results module.

---

## 10. Dependencies & Risks

| Item | Type | Impact | Owner |
|---|---|---|---|
| shadcn Collapsible component must be installed | Dependency | High — core layout pattern | Miguel |
| `DesignOpsStepNav` removal breaks test assertions | Risk | Med — `design-ops-layout.test.mjs` asserts on step nav | Miguel |
| Metric label resolution needs lookup utility | Dependency | Low — helper function needed to map value → label | Miguel |

---

## 11. Decision Log

| Date | Decision | Rationale | Made by |
|---|---|---|---|
| 2026-03-17 | Replace wizard (3 tabs) with single-page modular layout | Wizard causes context switching; user needs to see objective while running analysis | Miguel |
| 2026-03-17 | Previous objectives live inside Objective section (not a separate module) | Contextually owned by objective management; avoids extra module | Miguel |
| 2026-03-17 | Light mode, high contrast | Better readability; matches tool's professional context | Miguel |
| 2026-03-17 | Metrics/segments always shown as human-readable labels | Underscore keys are unreadable; labels exist in the codebase already | Miguel |
| 2026-03-17 | Static HTML mockup built and approved before implementation | Design process rule: validate in static page first | Miguel |

---

## 12. Open Items

- [ ] Confirm whether Results module should auto-open when a run completes (assumed: yes)
- [ ] Confirm default open module on first page load (assumed: Objective open, others collapsed)
