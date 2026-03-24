# Design Ops IA Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3-step wizard navigation in Design Ops with a single-page layout of three independently collapsible modules (Objective, Run Analysis, Results) matching the approved static HTML mockup.

**Architecture:** `DesignOpsClient` is rewritten as the sole layout owner — it holds open/closed state for each module as local booleans and wires all existing sub-components into shadcn `Collapsible` cards. The `useDesignOpsWorkspace` hook is trimmed to remove wizard-specific state (`activeStep`, `canOpenSynthesis`, `canOpenFindings`). `DesignOpsStepNav` is deleted entirely. A new `lib/design-ops-label-helpers.ts` utility resolves raw metric/segment/cohort keys to human-readable labels.

**Tech Stack:** Next.js App Router, TypeScript, shadcn/ui (Collapsible — install required), Tailwind CSS v4, Lucide React, Node.js built-in test runner (`node --test`)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Install | `components/ui/collapsible.tsx` | shadcn Collapsible primitive |
| Create | `lib/design-ops-label-helpers.ts` | Metric / segment / cohort key → label lookup |
| Create | `test/design-ops-label-helpers.test.mjs` | Tests for label helpers |
| Rewrite | `components/design/design-ops-client.tsx` | 3-module collapsible layout |
| Modify | `hooks/use-design-ops-workspace.ts` | Remove wizard state |
| Modify | `components/design/design-ops-objectives.tsx` | Use label helper for metric display |
| Delete | `components/design/design-ops-step-nav.tsx` | Wizard nav — removed |
| Update | `test/design-ops-layout.test.mjs` | Replace wizard assertions with collapsible assertions |

---

## Task 1: Install shadcn Collapsible

**Files:**
- Create: `components/ui/collapsible.tsx`

- [ ] **Step 1: Install the component**

```bash
cd /Users/miguelarias/cafemedia/design/carrier
npx shadcn@latest add collapsible --yes
```

- [ ] **Step 2: Verify the file exists and exports the three parts**

```bash
cat components/ui/collapsible.tsx
```

Expected output contains: `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent`

- [ ] **Step 3: Commit**

```bash
git add components/ui/collapsible.tsx
git commit -m "feat: install shadcn Collapsible component"
```

---

## Task 2: Create label helper utility + test

**Files:**
- Create: `lib/design-ops-label-helpers.ts`
- Create: `test/design-ops-label-helpers.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `test/design-ops-label-helpers.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("design-ops-label-helpers exports three lookup functions", () => {
  const helpers = read("lib/design-ops-label-helpers.ts");
  assert.match(helpers, /export function getMetricLabel/);
  assert.match(helpers, /export function getSegmentLabel/);
  assert.match(helpers, /export function getCohortLabel/);
});

test("getMetricLabel maps known values to labels", () => {
  const helpers = read("lib/design-ops-label-helpers.ts");
  // Should import from growth context, not inline the data
  assert.match(helpers, /growthMetricOptions/);
  assert.match(helpers, /designOpsSegments/);
  assert.match(helpers, /lifecycleCohortOptions/);
});

test("label helpers fall back to raw value when key is unknown", () => {
  const helpers = read("lib/design-ops-label-helpers.ts");
  // Each function must return `value` or `id` as fallback
  assert.match(helpers, /\?\? value|\?\? id/);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/miguelarias/cafemedia/design/carrier
node --test test/design-ops-label-helpers.test.mjs
```

Expected: FAIL — file does not exist yet.

- [ ] **Step 3: Create `lib/design-ops-label-helpers.ts`**

```ts
import {
  growthMetricOptions,
  lifecycleCohortOptions,
  designOpsSegments,
} from "@/lib/mock/design-ops-growth-context";

/** Maps a raw GrowthMetric key (e.g. "pvs_per_member_visitor") to its display label. */
export function getMetricLabel(value: string): string {
  return growthMetricOptions.find((o) => o.value === value)?.label ?? value;
}

/** Maps a segment id (e.g. "raptive-creators") to its display name. */
export function getSegmentLabel(id: string): string {
  return designOpsSegments.find((s) => s.id === id)?.name ?? id;
}

/** Maps a LifecycleCohort key (e.g. "new_users") to its display label. */
export function getCohortLabel(value: string): string {
  return lifecycleCohortOptions.find((o) => o.value === value)?.label ?? value;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test test/design-ops-label-helpers.test.mjs
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/design-ops-label-helpers.ts test/design-ops-label-helpers.test.mjs
git commit -m "feat: add design-ops label helper for metric/segment/cohort display"
```

---

## Task 3: Update layout test for new structure

**Files:**
- Modify: `test/design-ops-layout.test.mjs`

The existing test asserts on the wizard structure (step nav, "Continue to Run", "View Results", "Back to Run", etc.) and reads `design-ops-step-nav.tsx` which will be deleted. Replace the entire test with assertions that match the new collapsible layout.

- [ ] **Step 1: Replace `test/design-ops-layout.test.mjs`**

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("design-ops-client uses collapsible single-page layout", () => {
  const client = read("components/design/design-ops-client.tsx");

  // Uses shadcn Collapsible primitives
  assert.match(client, /Collapsible/);
  assert.match(client, /CollapsibleTrigger/);
  assert.match(client, /CollapsibleContent/);

  // Three open/close state booleans
  assert.match(client, /objectiveOpen/);
  assert.match(client, /runOpen/);
  assert.match(client, /resultsOpen/);

  // No wizard nav or step navigation
  assert.doesNotMatch(client, /DesignOpsStepNav/);
  assert.doesNotMatch(client, /activeStep/);
  assert.doesNotMatch(client, /Continue to Run/);
  assert.doesNotMatch(client, /View Results/);
  assert.doesNotMatch(client, /Back to Run/);
  assert.doesNotMatch(client, /setActiveStep/);

  // All three sub-components are wired
  assert.match(client, /DesignOpsObjectives/);
  assert.match(client, /DesignOpsCrewRunner/);
  assert.match(client, /DesignOpsFindingsSummary/);
  assert.match(client, /DesignOpsTimeline/);
  assert.match(client, /DesignOpsArchiveList/);

  // Results auto-opens when run completes
  assert.match(client, /setResultsOpen\(true\)/);

  // canOpenRun / canOpenResults replace the old gate logic
  assert.match(client, /canOpenRun/);
  assert.match(client, /canOpenResults/);

  // Still reads local + debug params
  assert.match(client, /local.*=.*true|"local"/);
  assert.match(client, /showProcess\s*=\s*local\s*\|\|\s*debug/);
  assert.match(client, /showProcess={showProcess}/);
  assert.match(client, /Private view/);
});

test("useDesignOpsWorkspace hook does not export wizard state", () => {
  const hook = read("hooks/use-design-ops-workspace.ts");

  // Wizard state removed
  assert.doesNotMatch(hook, /activeStep/);
  assert.doesNotMatch(hook, /setActiveStep/);
  assert.doesNotMatch(hook, /canOpenSynthesis/);
  assert.doesNotMatch(hook, /canOpenFindings/);
  assert.doesNotMatch(hook, /DesignOpsStep/);

  // Data state still present
  assert.match(hook, /pendingObjectiveDeletes/);
  assert.match(hook, /pendingArchiveDeletes/);
  assert.match(hook, /toast\("Objective removed"/);
  assert.match(hook, /toast\("Synthesis removed"/);
  assert.match(hook, /archiveRun/);
});

test("design-ops-step-nav file is deleted", () => {
  const exists = fs.existsSync(
    path.join(root, "components/design/design-ops-step-nav.tsx")
  );
  assert.equal(exists, false, "design-ops-step-nav.tsx should be deleted");
});

test("DesignOpsObjectives uses getMetricLabel for previous objectives display", () => {
  const objectives = read("components/design/design-ops-objectives.tsx");
  assert.match(objectives, /getMetricLabel/);
  assert.match(objectives, /Load/);
  assert.match(objectives, /Previous objectives/);
});
```

- [ ] **Step 2: Run test to verify it fails (old code)**

```bash
cd /Users/miguelarias/cafemedia/design/carrier
node --test test/design-ops-layout.test.mjs
```

Expected: FAIL — new assertions don't match existing code yet.

- [ ] **Step 3: Commit the updated test**

```bash
git add test/design-ops-layout.test.mjs
git commit -m "test: update design-ops-layout assertions for collapsible IA"
```

---

## Task 4: Rewrite design-ops-client.tsx

**Files:**
- Modify: `components/design/design-ops-client.tsx`

This is the primary layout change. Replace the 3-step wizard with three independent `Collapsible` card modules.

- [ ] **Step 1: Replace `components/design/design-ops-client.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, Play, Sparkles, Target } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DesignOpsObjectives } from "@/components/design/design-ops-objectives";
import { DesignOpsCrewRunner } from "@/components/design/design-ops-crew-runner";
import { DesignOpsFindingsSummary } from "@/components/design/design-ops-findings-summary";
import { DesignOpsTimeline } from "@/components/design/design-ops-timeline";
import { DesignOpsArchiveList } from "@/components/design/design-ops-archive-list";
import { useDesignOpsWorkspace } from "@/hooks/use-design-ops-workspace";
import { extractSection } from "@/lib/design-ops-formatting";

export function DesignOpsClient() {
  const searchParams = useSearchParams();
  const local = searchParams.get("local") === "true";
  const debug = searchParams.get("debug") === "true";
  const showProcess = local || debug;

  const [objectiveOpen, setObjectiveOpen] = useState(true);
  const [runOpen, setRunOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);

  const {
    objectives,
    activeObjectiveId,
    activeObjective,
    messages,
    archives,
    running,
    loading,
    currentRunMode,
    setActiveObjectiveId,
    setMessages,
    setRunning,
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

  const canOpenRun = Boolean(activeObjective);
  const canOpenResults = messages.length > 0 || archives.length > 0 || running;

  // Derive synthesis message for Results header badges
  const synthesis =
    messages.find(
      (msg) => msg.from === "research_insights" && msg.confidence !== "n/a"
    ) ?? null;
  const phase = synthesis ? extractSection(synthesis.body, "PHASE") : "";

  // Status badges
  const runBadge = running ? "Running" : canOpenRun ? "Ready" : "Waiting";
  const resultsBadge = synthesis
    ? `${synthesis.confidence} confidence`
    : canOpenResults
    ? "In progress"
    : "No results";

  return (
    <div className="min-w-0 space-y-2">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Design Ops</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-powered research synthesis tied to one active business objective at a time.
        </p>
      </div>

      {/* ── Objective Module ── */}
      <Collapsible open={objectiveOpen} onOpenChange={setObjectiveOpen}>
        <Card className="overflow-hidden">
          <CollapsibleTrigger className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40">
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded border transition-colors ${
                objectiveOpen
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              <Target className="size-4" />
            </div>
            <span className="flex-1 text-sm font-semibold">Objective</span>
            <Badge variant={activeObjective ? "default" : "secondary"} className="text-xs">
              {activeObjective ? "Active" : "Not set"}
            </Badge>
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform ${
                objectiveOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator />
            <div className="px-4 pb-6 pt-5">
              <DesignOpsObjectives
                objectives={objectives}
                activeObjectiveId={activeObjectiveId}
                onActiveObjectiveChange={setActiveObjectiveId}
                onAdd={addObjective}
                onUpdate={updateObjective}
                onDelete={deleteObjective}
              />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Run Analysis Module ── */}
      <Collapsible
        open={runOpen}
        onOpenChange={(open) => {
          if (!canOpenRun && open) return;
          setRunOpen(open);
        }}
      >
        <Card className="overflow-hidden">
          <CollapsibleTrigger
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-50"
            disabled={!canOpenRun}
          >
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded border transition-colors ${
                runOpen
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {running ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
            </div>
            <span className="flex-1 text-sm font-semibold">Run Analysis</span>
            <Badge
              variant={running ? "default" : canOpenRun ? "secondary" : "outline"}
              className="text-xs"
            >
              {runBadge}
            </Badge>
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform ${
                runOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator />
            <div className="px-4 pb-6 pt-5">
              <DesignOpsCrewRunner
                objective={activeObjective}
                onMessages={setMessages}
                onRunStatusChange={setRunning}
                onModeChange={setCurrentRunMode}
                onRunComplete={async (payload) => {
                  await archiveRun(payload);
                  setResultsOpen(true);
                }}
              />
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Results Module ── */}
      <Collapsible
        open={resultsOpen}
        onOpenChange={(open) => {
          if (!canOpenResults && open) return;
          setResultsOpen(open);
        }}
      >
        <Card className="overflow-hidden">
          <CollapsibleTrigger
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-50"
            disabled={!canOpenResults}
          >
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded border transition-colors ${
                resultsOpen
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              <Sparkles className="size-4" />
            </div>
            <span className="flex-1 text-sm font-semibold">Results</span>
            {local && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Private view
              </Badge>
            )}
            {phase && (
              <Badge variant="secondary" className="text-xs capitalize">
                {phase}
              </Badge>
            )}
            <Badge
              variant={synthesis ? "default" : "secondary"}
              className="text-xs capitalize"
            >
              {resultsBadge}
            </Badge>
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform ${
                resultsOpen ? "rotate-180" : ""
              }`}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator />
            <div className="space-y-6 px-4 pb-6 pt-5">
              {(messages.length > 0 || running) && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {running ? "Live run" : "Analysis"}
                  </h3>
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

              {archives.length === 0 && messages.length === 0 && !running && (
                <p className="text-sm text-muted-foreground">
                  Run an analysis to see results here.
                </p>
              )}

              {archives.length > 0 && (
                <DesignOpsArchiveList archives={archives} onDelete={deleteArchive} />
              )}
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
```

- [ ] **Step 2: Run the layout test**

```bash
cd /Users/miguelarias/cafemedia/design/carrier
node --test test/design-ops-layout.test.mjs
```

Expected: The "uses collapsible single-page layout" test passes. The "step-nav deleted" test and "hook" test will still fail (step nav exists, hook not updated yet).

- [ ] **Step 3: Also run the results-layers test to confirm it still passes**

```bash
node --test test/design-ops-results-layers.test.mjs
```

Expected: All 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add components/design/design-ops-client.tsx
git commit -m "feat: replace design-ops wizard with 3-module collapsible layout"
```

---

## Task 5: Update hook + delete step-nav

**Files:**
- Modify: `hooks/use-design-ops-workspace.ts`
- Delete: `components/design/design-ops-step-nav.tsx`

- [ ] **Step 1: Remove wizard state from `hooks/use-design-ops-workspace.ts`**

Remove the following lines:

```ts
// DELETE this import:
import type { DesignOpsStep } from "@/components/design/design-ops-step-nav";

// DELETE this state declaration:
const [activeStep, setActiveStep] = useState<DesignOpsStep>("objective");

// DELETE these derived values:
const canOpenSynthesis = Boolean(activeObjective);
const canOpenFindings = messages.length > 0 || archives.length > 0 || running;
```

Inside `archiveRun`, remove the `setActiveStep("findings")` call:

```ts
// DELETE this line inside archiveRun:
setActiveStep("findings");
```

Remove from the return object:

```ts
// DELETE from return:
activeStep,
canOpenSynthesis,
canOpenFindings,
setActiveStep,
```

- [ ] **Step 2: Delete `components/design/design-ops-step-nav.tsx`**

```bash
rm /Users/miguelarias/cafemedia/design/carrier/components/design/design-ops-step-nav.tsx
```

- [ ] **Step 3: Run the full layout test suite**

```bash
cd /Users/miguelarias/cafemedia/design/carrier
node --test test/design-ops-layout.test.mjs
```

Expected: All 4 tests pass.

- [ ] **Step 4: Run all design-ops tests**

```bash
node --test test/design-ops-*.test.mjs
```

Expected: All pass.

- [ ] **Step 5: Commit**

```bash
git add hooks/use-design-ops-workspace.ts
git rm components/design/design-ops-step-nav.tsx
git commit -m "refactor: remove wizard state from workspace hook, delete step-nav"
```

---

## Task 6: Use label helper in DesignOpsObjectives

**Files:**
- Modify: `components/design/design-ops-objectives.tsx`

The previous objectives list currently shows `objective.metric` as the raw key (e.g. `pvs_per_member_visitor`). Replace with `getMetricLabel()`.

- [ ] **Step 1: Add import to `design-ops-objectives.tsx`**

At the top of the file, add:

```ts
import { getMetricLabel } from "@/lib/design-ops-label-helpers";
```

- [ ] **Step 2: Replace the raw metric badge in the previous objectives list**

Find (around line 176):

```tsx
<Badge variant="secondary">{objective.metric}</Badge>
```

Replace with:

```tsx
<Badge variant="secondary">{getMetricLabel(objective.metric)}</Badge>
```

- [ ] **Step 3: Run layout test**

```bash
cd /Users/miguelarias/cafemedia/design/carrier
node --test test/design-ops-layout.test.mjs
```

Expected: All 4 tests pass (including "uses getMetricLabel" assertion).

- [ ] **Step 4: Run full design-ops test suite**

```bash
node --test test/design-ops-*.test.mjs
```

Expected: All pass.

- [ ] **Step 5: Verify dev server compiles cleanly**

```bash
cd /Users/miguelarias/cafemedia/design/carrier
npm run build 2>&1 | tail -20
```

Expected: No TypeScript errors. Build completes.

- [ ] **Step 6: Commit**

```bash
git add components/design/design-ops-objectives.tsx
git commit -m "feat: display human-readable metric labels in previous objectives list"
```

---

## Verification Checklist

After all tasks complete, confirm the following manually in the browser at `http://localhost:3500/design-ops`:

- [ ] Page loads with Objective module open, Run Analysis and Results collapsed
- [ ] Run Analysis module header shows "Waiting" badge when no objective is set; cannot be opened
- [ ] Results module header shows "No results" badge when no run has been done; cannot be opened
- [ ] Setting an active objective enables the Run Analysis module ("Ready" badge)
- [ ] Running an analysis shows "Running" badge + spinner on Run Analysis header
- [ ] After a run completes, Results module auto-opens and shows the synthesis
- [ ] `?local=true` in URL shows "Private view" badge in Results header and uses the timeline view
- [ ] Previous objectives list shows human-readable metric labels (not underscore keys)
- [ ] Chevron rotates 180° when module is open
- [ ] Module header icon inverts (white icon on dark background) when open
