# Design Ops — Results Two-Layer View

**Date:** 2026-03-17
**Goal:** Split the Results step into a stakeholder-facing shared layer and a full private working view for the designer, toggled by URL param.

---

## Problem

The Results step currently exposes everything — agent synthesis, reasoning, confidence scores, readiness judgments, process details — to anyone the URL is shared with. Stakeholders receive too much internal framing. Designers have no clean way to share a distilled summary without exposing the full working view.

---

## Design Decisions

### Layer separation

Two views toggled by a single URL param. `?local=true` activates the private layer. The default (no param) shows the shared layer. No new routes, no auth.

---

### Shared layer (default)

Visible to anyone the URL is shared with. Fully replaces the entire Results step content — the timeline and all associated elements are not rendered.

Renders only:

- **Recommendation** — the clearest move, tied to metric and segment
- **Top 3 findings** — scannable bullets, no jargon
- **Confidence** — high / medium / low with one line of reasoning
- **Next steps** — what should happen and who owns it

No agent names, no internal framing, no process details.

**Source message:** Extract all four fields from the single `AgentMessage` where `msg.from === "research_insights"` and `msg.confidence !== "n/a"`. This is always the synthesis output from Research & Insights. In a quick read run there is one such message; in balanced/deep runs there may be a preceding Design Strategy brief — skip it (its `confidence` is `"n/a"`).

**Extraction:** `DesignOpsFindingsSummary` receives `messages: AgentMessage[]` and performs extraction internally. It filters to the synthesis message, then reads:
- `msg.confidence` for the confidence level — already a clean string field
- `msg.nextStep` for the next steps line — already a clean string field
- `msg.body` for recommendation and top findings — the body is plain text with structured sections (e.g. `"TOP FINDINGS:\n- ...\nRECOMMENDATION:\n..."`). Parse using the same `extract_section(text, "TOP FINDINGS")` / `extract_section(text, "RECOMMENDATION")` utility already used in the Python backend. A matching TypeScript helper should be added to `lib/design-ops-formatting.ts`.

If no qualifying message exists (run not yet complete), render a neutral empty state: "Run an analysis to see results here."

---

### Private layer (`?local=true`)

The designer's full working view. Shows everything the current Results step renders:

- Full synthesis output (all agent messages)
- Readiness judgment
- Assumptions
- Additional signals worth gathering
- Prioritization note (effort signal + current cycle or future)
- Process details (subsumed from `?debug=true` — see migration note below)

A small muted **"Private view"** badge appears as a trailing inline element on the same line as the "Analysis" heading, right-aligned, when `?local=true` is active. No badge shown in shared view.

---

### `?debug=true` migration

`?local=true` subsumes `?debug=true`. Both `useSearchParams()` reads happen in `design-ops-client.tsx`. The boolean is computed once and passed down:

```ts
const local = searchParams.get("local") === "true";
const debug = searchParams.get("debug") === "true";
const showProcess = local || debug;
```

`showProcess` is passed as a prop to `DesignOpsTimeline`. The `useSearchParams()` call in `design-ops-timeline.tsx` is removed — the component becomes a pure prop receiver.

---

### Props

**`DesignOpsFindingsSummary`**
```ts
interface DesignOpsFindingsSummaryProps {
  messages: AgentMessage[];
}
```
Extraction logic lives inside the component.

**`DesignOpsTimeline`** — add one prop:
```ts
showProcess: boolean; // replaces internal useSearchParams call
```

---

## Files Affected

| File | Change |
|------|--------|
| `components/design/design-ops-client.tsx` | Read `?local=true` and `?debug=true` via `useSearchParams()`. Compute `showProcess = local \|\| debug`. In Results step: render `DesignOpsFindingsSummary` when `!local`, full `DesignOpsTimeline` when `local`. Pass `showProcess` to timeline. Show "Private view" badge in section header when `local`. |
| `components/design/design-ops-timeline.tsx` | Remove internal `useSearchParams()` call. Accept `showProcess: boolean` prop instead. No other changes. |
| `components/design/design-ops-findings-summary.tsx` | New component. Accepts `messages: AgentMessage[]`. Finds synthesis message (`from === "research_insights"`, `confidence !== "n/a"`), renders shared layer. |

---

## Out of Scope

- Changes to the archive view
- Changes to the Run step
- Mobile layout changes
- Authentication or access control (URL param only)
- Separate shareable route or link generation
