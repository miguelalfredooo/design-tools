# Design Ops Results Two-Layer View Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the Design Ops Results step into a clean stakeholder-facing shared layer (default) and a full private working view (`?local=true`), with no new API or data changes.

**Architecture:** `design-ops-client.tsx` reads `?local=true` and `?debug=true` from `useSearchParams()`, computes `showProcess`, and conditionally renders either the new `DesignOpsFindingsSummary` (shared) or the existing `DesignOpsTimeline` (private). The timeline loses its internal `useSearchParams()` call and becomes a pure prop receiver. A new `extractSection` TypeScript helper in `lib/design-ops-formatting.ts` parses structured sections from the synthesis message body.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, node:test (static file analysis tests)

---

## File Structure

| File | Role |
|------|------|
| `components/design/design-ops-findings-summary.tsx` | **New.** Shared layer component — finds synthesis message, extracts and renders recommendation, top findings, confidence, next steps. |
| `components/design/design-ops-client.tsx` | **Modify.** Read `?local=true` + `?debug=true`, compute `showProcess`, conditionally render findings summary vs timeline, show "Private view" badge. |
| `components/design/design-ops-timeline.tsx` | **Modify.** Remove `useSearchParams()`, accept `showProcess: boolean` prop. |
| `lib/design-ops-formatting.ts` | **Modify.** Add `extractSection(body, sectionName)` helper. |
| `test/design-ops-results-layers.test.mjs` | **New.** Static file assertions for all layer logic. |
| `test/design-ops-timeline-debug.test.mjs` | **Modify.** Update assertions — timeline no longer uses `useSearchParams` internally. |

---

## Task 1: Add `extractSection` helper to `lib/design-ops-formatting.ts`

The synthesis message body contains structured plain-text sections like:
```
TOP FINDINGS: ...
RECOMMENDATION: ...
```
We need a helper to pull a named section out of that string.

**Files:**
- Modify: `lib/design-ops-formatting.ts`
- Test: `test/design-ops-results-layers.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `test/design-ops-results-layers.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("extractSection is exported from design-ops-formatting", () => {
  const formatting = read("lib/design-ops-formatting.ts");
  assert.match(formatting, /export function extractSection/);
  assert.match(formatting, /sectionName/);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/miguelarias/cafemedia/design/carrier
node --test test/design-ops-results-layers.test.mjs
```

Expected: FAIL — `extractSection` not found.

- [ ] **Step 3: Add `extractSection` to `lib/design-ops-formatting.ts`**

Append to the end of the file:

```ts
/**
 * Extract a named section from a structured plain-text synthesis body.
 * Sections are delimited by ALL-CAPS labels followed by a colon.
 * Returns the section content as a trimmed string, or "" if not found.
 *
 * Example body:
 *   "TOP FINDINGS:\n- Finding one\n- Finding two\nRECOMMENDATION:\nDo X."
 *
 * extractSection(body, "TOP FINDINGS") → "- Finding one\n- Finding two"
 */
export function extractSection(body: string, sectionName: string): string {
  const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `${escaped}\\s*:?\\s*\\n([\\s\\S]*?)(?=\\n[A-Z][A-Z\\s]+:\\s*\\n|$)`,
    "i"
  );
  const match = body.match(pattern);
  return match ? match[1].trim() : "";
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/design-ops-results-layers.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/design-ops-formatting.ts test/design-ops-results-layers.test.mjs
git commit -m "feat(design-ops): add extractSection helper to formatting utils"
```

---

## Task 2: Migrate `showProcess` out of `design-ops-timeline.tsx`

The timeline currently calls `useSearchParams()` internally. We move this responsibility to `design-ops-client.tsx` and make the timeline a pure prop receiver.

**Files:**
- Modify: `components/design/design-ops-timeline.tsx`
- Modify: `test/design-ops-timeline-debug.test.mjs`

- [ ] **Step 1: Update the existing test to reflect the new contract**

Open `test/design-ops-timeline-debug.test.mjs` and replace its content:

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("design ops timeline receives showProcess as a prop, not via useSearchParams", () => {
  const timeline = read("components/design/design-ops-timeline.tsx");

  // showProcess must come from props, not internal searchParams
  assert.doesNotMatch(timeline, /useSearchParams/);
  assert.match(timeline, /showProcess/);
  assert.match(timeline, /showProcess\s*:\s*boolean/);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/design-ops-timeline-debug.test.mjs
```

Expected: FAIL — timeline still uses `useSearchParams`.

- [ ] **Step 3: Update `DesignOpsTimelineProps` and remove `useSearchParams`**

In `components/design/design-ops-timeline.tsx`:

1. Remove `useSearchParams` from the import at line 4.
2. Add `showProcess: boolean` to the `DesignOpsTimelineProps` interface:

```ts
interface DesignOpsTimelineProps {
  messages: AgentMessage[];
  mode?: SynthesisMode;
  showProcess: boolean;
}
```

3. Update the function signature to destructure `showProcess` from props:

```ts
export function DesignOpsTimeline({ messages, mode = "decision_memo", showProcess }: DesignOpsTimelineProps) {
```

4. Remove these two lines (currently around line 474–475):

```ts
const searchParams = useSearchParams();
const showProcess = searchParams.get("debug") === "true";
```

`showProcess` is now received from props — no local declaration needed.

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/design-ops-timeline-debug.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/design/design-ops-timeline.tsx test/design-ops-timeline-debug.test.mjs
git commit -m "refactor(design-ops): move showProcess out of timeline into parent"
```

---

## Task 3: Create `DesignOpsFindingsSummary` — the shared layer component

This is the new component shown to stakeholders. It finds the synthesis message, extracts the four fields, and renders them cleanly with no agent names or internal framing.

**Files:**
- Create: `components/design/design-ops-findings-summary.tsx`
- Modify: `test/design-ops-results-layers.test.mjs`

- [ ] **Step 1: Add test assertions for the new component**

Append to `test/design-ops-results-layers.test.mjs`:

```js
test("DesignOpsFindingsSummary component exists and has correct structure", () => {
  const summary = read("components/design/design-ops-findings-summary.tsx");

  // Receives messages array
  assert.match(summary, /messages.*AgentMessage\[\]|AgentMessage\[\].*messages/);

  // Filters to synthesis message
  assert.match(summary, /research_insights/);
  assert.match(summary, /confidence\s*!==\s*["']n\/a["']/);

  // Uses extractSection
  assert.match(summary, /extractSection/);
  assert.match(summary, /RECOMMENDATION/);
  assert.match(summary, /TOP FINDINGS/);

  // Empty state
  assert.match(summary, /Run an analysis to see results here/);

  // No agent names surfaced
  assert.doesNotMatch(summary, /Research & Insights/);
  assert.doesNotMatch(summary, /Design Strategy/);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test test/design-ops-results-layers.test.mjs
```

Expected: FAIL — component doesn't exist yet.

- [ ] **Step 3: Create `components/design/design-ops-findings-summary.tsx`**

```tsx
"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { extractSection } from "@/lib/design-ops-formatting";
import type { AgentMessage } from "@/lib/design-ops-types";

interface DesignOpsFindingsSummaryProps {
  messages: AgentMessage[];
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function DesignOpsFindingsSummary({ messages }: DesignOpsFindingsSummaryProps) {
  const synthesis = useMemo(
    () =>
      messages.find(
        (msg) => msg.from === "research_insights" && msg.confidence !== "n/a"
      ) ?? null,
    [messages]
  );

  if (!synthesis) {
    return (
      <p className="text-sm text-muted-foreground">
        Run an analysis to see results here.
      </p>
    );
  }

  const recommendation = extractSection(synthesis.body, "RECOMMENDATION");
  const topFindings = extractSection(synthesis.body, "TOP FINDINGS");
  const findingLines = topFindings
    .split("\n")
    .map((l) => l.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  const confidenceStyle =
    CONFIDENCE_STYLES[synthesis.confidence?.toLowerCase() ?? ""] ??
    "bg-muted text-muted-foreground";

  return (
    <div className="space-y-5">
      {/* Confidence */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Confidence
        </span>
        <Badge
          variant="outline"
          className={`text-xs font-semibold capitalize ${confidenceStyle}`}
        >
          {synthesis.confidence}
        </Badge>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recommendation
          </p>
          <p className="text-sm leading-6 text-foreground">{recommendation}</p>
        </div>
      )}

      {/* Top findings */}
      {findingLines.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Top findings
          </p>
          <ul className="space-y-1.5">
            {findingLines.map((finding, i) => (
              <li key={i} className="flex gap-2 text-sm leading-6 text-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      {synthesis.nextStep && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Next steps
          </p>
          <p className="text-sm leading-6 text-foreground">{synthesis.nextStep}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/design-ops-results-layers.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/design/design-ops-findings-summary.tsx test/design-ops-results-layers.test.mjs
git commit -m "feat(design-ops): add DesignOpsFindingsSummary shared layer component"
```

---

## Task 4: Update `design-ops-client.tsx` — wire layers and `showProcess`

Wire everything together: read params, conditionally render shared vs private layer, pass `showProcess` to timeline, show "Private view" badge.

**Files:**
- Modify: `components/design/design-ops-client.tsx`
- Modify: `test/design-ops-results-layers.test.mjs`

- [ ] **Step 1: Add test assertions for client wiring**

Append to `test/design-ops-results-layers.test.mjs`:

```js
test("design-ops-client wires local param and renders correct layer", () => {
  const client = read("components/design/design-ops-client.tsx");

  // Reads both params
  assert.match(client, /local.*=.*true|"local"/);
  assert.match(client, /debug.*=.*true|"debug"/);
  assert.match(client, /showProcess\s*=\s*local\s*\|\|\s*debug/);

  // Imports and renders both components
  assert.match(client, /DesignOpsFindingsSummary/);
  assert.match(client, /DesignOpsTimeline/);

  // Passes showProcess to timeline
  assert.match(client, /showProcess={showProcess}/);

  // Private view badge
  assert.match(client, /Private view/);
});

test("design-ops-client passes showProcess to DesignOpsTimeline", () => {
  const client = read("components/design/design-ops-client.tsx");
  // Timeline always gets showProcess, not useSearchParams internally
  assert.match(client, /showProcess={showProcess}/);
  assert.doesNotMatch(client, /showProcess={true}/);
  assert.doesNotMatch(client, /showProcess={false}/);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
node --test test/design-ops-results-layers.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Update `design-ops-client.tsx`**

Replace the entire file content with the updated version below. Key changes:
- Add `"use client"` already present — keep it
- Import `useSearchParams` from `"next/navigation"`
- Import `DesignOpsFindingsSummary`
- Compute `local`, `debug`, `showProcess`
- In the findings section: render summary when `!local`, timeline when `local`
- Pass `showProcess` to `DesignOpsTimeline`
- Show "Private view" badge in section header when `local`

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { DesignOpsStepNav } from "@/components/design/design-ops-step-nav";
import { DesignOpsObjectives } from "@/components/design/design-ops-objectives";
import { DesignOpsCrewRunner } from "@/components/design/design-ops-crew-runner";
import { DesignOpsTimeline } from "@/components/design/design-ops-timeline";
import { DesignOpsFindingsSummary } from "@/components/design/design-ops-findings-summary";
import { DesignOpsArchiveList } from "@/components/design/design-ops-archive-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDesignOpsWorkspace } from "@/hooks/use-design-ops-workspace";

export function DesignOpsClient() {
  const searchParams = useSearchParams();
  const local = searchParams.get("local") === "true";
  const debug = searchParams.get("debug") === "true";
  const showProcess = local || debug;

  const {
    objectives,
    activeObjectiveId,
    activeObjective,
    messages,
    archives,
    running,
    loading,
    activeStep,
    currentRunMode,
    canOpenSynthesis,
    canOpenFindings,
    setActiveObjectiveId,
    setMessages,
    setRunning,
    setActiveStep,
    setCurrentRunMode,
    addObjective,
    updateObjective,
    deleteObjective,
    deleteArchive,
    archiveRun,
  } = useDesignOpsWorkspace();

  if (loading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading Design Ops...
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Design Ops</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-powered research synthesis tied to one active business objective at a time.
        </p>
      </div>

      <DesignOpsStepNav
        activeStep={activeStep}
        canOpenSynthesis={canOpenSynthesis}
        canOpenFindings={canOpenFindings}
        onStepChange={setActiveStep}
      />

      {activeStep === "objective" ? (
        <section className="space-y-6">
          <DesignOpsObjectives
            objectives={objectives}
            activeObjectiveId={activeObjectiveId}
            onActiveObjectiveChange={setActiveObjectiveId}
            onAdd={addObjective}
            onUpdate={updateObjective}
            onDelete={deleteObjective}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setActiveStep("synthesis")}
              disabled={!canOpenSynthesis}
            >
              Continue to Run
            </Button>
          </div>
        </section>
      ) : null}

      {activeStep === "synthesis" ? (
        <section className="space-y-6">
          <DesignOpsCrewRunner
            objective={activeObjective}
            onMessages={setMessages}
            onRunStatusChange={setRunning}
            onModeChange={setCurrentRunMode}
            onRunComplete={archiveRun}
          />

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setActiveStep("objective")}>
              Back to Objective
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStep("findings")}
              disabled={!canOpenFindings}
            >
              View Results
            </Button>
          </div>
        </section>
      ) : null}

      {activeStep === "findings" ? (
        <section className="space-y-6">
          {(messages.length > 0 || running) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {running ? "Live run" : "Analysis"}
                </h3>
                {local && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Private view
                  </Badge>
                )}
              </div>
              {local ? (
                <DesignOpsTimeline
                  messages={messages}
                  mode={currentRunMode}
                  showProcess={showProcess}
                />
              ) : (
                <DesignOpsFindingsSummary messages={messages} />
              )}
            </div>
          )}

          <DesignOpsArchiveList archives={archives} onDelete={deleteArchive} />

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={() => setActiveStep("synthesis")}>
              Back to Run
            </Button>
            <Button type="button" variant="outline" onClick={() => setActiveStep("objective")}>
              Edit Objective
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Run all design-ops tests**

```bash
node --test test/design-ops-results-layers.test.mjs test/design-ops-timeline-debug.test.mjs test/design-ops-layout.test.mjs
```

Expected: All PASS.

- [ ] **Step 5: Verify `design-ops-layout.test.mjs` still passes (regression check)**

The layout test checks for `Analysis` in the client — the new header structure still includes it. If any assertion fails, read the error carefully — the heading is now inside a flex container but the text content is unchanged.

- [ ] **Step 6: Run full test suite**

```bash
node --test test/*.test.mjs 2>&1 | tail -20
```

Expected: All passing. Fix any regressions before committing.

- [ ] **Step 7: Commit**

```bash
git add components/design/design-ops-client.tsx test/design-ops-results-layers.test.mjs
git commit -m "feat(design-ops): wire shared/private results layers behind ?local=true"
```

---

## Verification

After all tasks:

1. Open http://localhost:3500/design-ops and run an analysis
2. **Default view** — Results step shows recommendation, top findings, confidence, next steps. No agent names visible.
3. **Private view** — Add `?local=true` to URL. Full timeline appears with "Private view" badge in header. Process details visible.
4. **Debug compat** — Add `?debug=true` without `?local=true`. Process details should still show (backwards compat). No "Private view" badge.
5. **Empty state** — Navigate to Results with no messages. Should show "Run an analysis to see results here."
