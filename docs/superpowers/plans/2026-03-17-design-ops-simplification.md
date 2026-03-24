# Design Ops Simplification Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce cognitive overload in the Design Ops section so stakeholders can participate without needing to understand internal terminology or fill out 8+ fields to get a useful synthesis.

**Architecture:** UI-only changes across 4 components and 2 test files. No backend, API, hook logic, or data model changes. The underlying `DesignOpsStep` enum values and `SynthesisMode` type are unchanged — only display labels and rendered UI are updated.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4. Tests use Node.js built-in `node:test` runner with static file analysis (no component rendering).

**Run tests:** `node --test test/<filename>.test.mjs` from `/Users/miguelarias/cafemedia/design/carrier`

**Spec:** `docs/superpowers/specs/2026-03-17-design-ops-simplification-design.md`

---

## Task 1: Step nav + client navigation labels

Rename step display labels (Synthesis → Run, Findings → Results) and update all button labels and section headers in the client that reference those steps.

**Files:**
- Modify: `components/design/design-ops-step-nav.tsx`
- Modify: `components/design/design-ops-client.tsx`
- Modify: `test/design-ops-layout.test.mjs`

- [ ] **Step 1: Update the test to expect new labels (it will fail until code changes)**

In `test/design-ops-layout.test.mjs`, replace the following assertions:

```js
// Remove these:
assert.match(stepNav, /Synthesis/);
assert.match(stepNav, /Findings/);
assert.match(client, /Continue to Synthesis/);
assert.match(client, /Current findings/);

// Add these:
assert.match(stepNav, /Run/);
assert.match(stepNav, /Results/);
assert.doesNotMatch(stepNav, /label: "Synthesis"/);
assert.doesNotMatch(stepNav, /label: "Findings"/);
assert.match(client, /Continue to Run/);
assert.match(client, /View Results/);
assert.match(client, /Back to Run/);
assert.match(client, /Analysis/);
assert.doesNotMatch(client, /Continue to Synthesis/);
assert.doesNotMatch(client, /Current findings/);
assert.doesNotMatch(client, /View Findings/);
assert.doesNotMatch(client, /Back to Synthesis/);
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
node --test test/design-ops-layout.test.mjs
```

Expected: FAIL — assertions about new labels fail, old labels still present.

- [ ] **Step 3: Update step labels in `design-ops-step-nav.tsx`**

Change the `STEPS` array labels:

```tsx
const STEPS: Array<{
  id: DesignOpsStep;
  label: string;
  icon: typeof FileText;
}> = [
  { id: "objective", label: "Objective", icon: FileText },
  { id: "synthesis", label: "Run", icon: Sparkles },
  { id: "findings", label: "Results", icon: CheckCircle2 },
];
```

- [ ] **Step 4: Update button labels and section headers in `design-ops-client.tsx`**

Make these targeted replacements:

```tsx
// Button: step 1 → step 2
<Button type="button" onClick={() => setActiveStep("synthesis")} disabled={!canOpenSynthesis}>
  Continue to Run
</Button>

// Button: step 2 → step 1
<Button type="button" variant="ghost" onClick={() => setActiveStep("objective")}>
  Back to Objective
</Button>

// Button: step 2 → step 3
<Button type="button" variant="outline" onClick={() => setActiveStep("findings")} disabled={!canOpenFindings}>
  View Results
</Button>

// Button: step 3 → step 2
<Button type="button" variant="ghost" onClick={() => setActiveStep("synthesis")}>
  Back to Run
</Button>

// Section header (line ~113)
<h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
  {running ? "Live run" : "Analysis"}
</h3>
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
node --test test/design-ops-layout.test.mjs
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/design/design-ops-step-nav.tsx components/design/design-ops-client.tsx test/design-ops-layout.test.mjs
git commit -m "feat(design-ops): rename step labels to Objective / Run / Results"
```

---

## Task 2: Objective fields collapsible

Move all fields except title, problem/opportunity, and primary metric into a single "Add context (optional)" collapsible. This replaces the existing two-level system (always-visible fields + "More context" toggle for type/owner).

**Files:**
- Modify: `components/design/design-ops-objective-fields.tsx`
- Modify: `test/design-ops-layout.test.mjs`

- [ ] **Step 1: Update the test to expect the new collapsible structure**

In `test/design-ops-layout.test.mjs`, replace:

```js
// Remove:
assert.match(objectiveFields, /More context/);
assert.match(objectiveFields, /When this matters/);

// Add:
assert.match(objectiveFields, /Add context \(optional\)/);
assert.doesNotMatch(objectiveFields, /More context/);
```

Keep all other `objectiveFields` assertions — the fields themselves remain in the file, just repositioned.

- [ ] **Step 2: Run test to confirm it fails**

```bash
node --test test/design-ops-layout.test.mjs
```

Expected: FAIL — "More context" assertion removed, "Add context (optional)" not yet present.

- [ ] **Step 3: Restructure `design-ops-objective-fields.tsx`**

The new layout has three always-visible fields, then everything else collapses. Replace the body of `DesignOpsObjectiveFields` with this structure:

**Always visible (required):**
1. Title / inline LiveDraftHeaderFields (unchanged)
2. Primary metric dropdown (move up from its current position below target/theory)

**Collapsible "Add context (optional)" section containing:**
- Target input
- Theory of success textarea ("Why this might work")
- Stage select ("When this matters")
- Segments multi-select
- Lifecycle cohorts multi-select
- Objective type select
- Owner input

The collapsible replaces both the old `showAdvanced` toggle and the fields that were always shown. Rename the state variable from `showAdvanced` to `showOptional` and change the toggle label:

```tsx
const [showOptional, setShowOptional] = useState(
  Boolean(objective?.target || objective?.theoryOfSuccess || objective?.owner || objective?.type !== "product")
);
```

Toggle button:
```tsx
<Button
  type="button"
  size="sm"
  variant="ghost"
  className="w-fit px-0 text-xs text-muted-foreground"
  onClick={() => setShowOptional(!showOptional)}
>
  {showOptional ? "Hide context" : "Add context (optional)"}
</Button>
```

The collapsible block:
```tsx
{showOptional && (
  <div className="space-y-3 rounded-xl border border-border/60 bg-secondary/20 p-4">
    {/* Target */}
    <div className="space-y-1">
      <Label htmlFor={`${idBase}-target`} className="text-sm font-semibold">Target</Label>
      <Input
        id={`${idBase}-target`}
        placeholder="Target (e.g., Increase 7-day return rate for newly onboarded users)"
        value={value.target}
        onChange={(e) => update("target", e.target.value)}
        className={isInline ? inlineInputClassName : undefined}
      />
    </div>
    {/* Theory of success */}
    <div className="space-y-1">
      <Label htmlFor={`${idBase}-theory`} className="text-sm font-semibold">Why this might work</Label>
      <Textarea
        id={`${idBase}-theory`}
        placeholder="If we use stated interests to recommend communities, posts, email content, and follow-up prompts, users will find relevant content faster and return more often."
        value={value.theoryOfSuccess ?? ""}
        onChange={(e) => update("theoryOfSuccess", e.target.value)}
        rows={3}
        className={isInline ? inlineBodyClassName : undefined}
      />
    </div>
    {/* Stage */}
    <div className="space-y-1">
      <Label htmlFor={`${idBase}-stage`} className="text-sm font-semibold">When this matters</Label>
      <Select value={value.stage} onValueChange={(next) => update("stage", next)}>
        <SelectTrigger id={`${idBase}-stage`} className="w-full" aria-label="When this matters">
          <SelectValue placeholder="When this matters" />
        </SelectTrigger>
        <SelectContent>
          {growthStageOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {/* Segments */}
    <DesignOpsMultiSelect
      id={`${idBase}-segments`}
      label="Segments"
      description="Which creator or community segments should this objective apply to?"
      placeholder="Choose one or more segments"
      placeholderClassName="text-lg"
      options={designOpsSegments.map((segment) => ({
        value: segment.id,
        label: segment.name,
        description: segment.description,
      }))}
      selectedValues={value.segmentIds}
      onToggle={toggleSegment}
    />
    {/* Lifecycle cohorts */}
    <DesignOpsMultiSelect
      id={`${idBase}-cohorts`}
      label="Lifecycle cohorts"
      description="Which in-product user behaviors matter most for this objective?"
      placeholder="Choose one or more cohorts"
      placeholderClassName="text-lg"
      options={lifecycleCohortOptions.map((cohort) => ({
        value: cohort.value,
        label: cohort.label,
        description: cohort.description,
      }))}
      selectedValues={value.lifecycleCohorts}
      onToggle={toggleLifecycleCohort}
    />
    {/* Objective type */}
    <div className="space-y-1">
      <Label htmlFor={`${idBase}-type`} className="text-sm font-semibold">Objective type</Label>
      <Select value={value.type} onValueChange={(next) => update("type", next)}>
        <SelectTrigger id={`${idBase}-type`} className="w-full" aria-label="Objective type">
          <SelectValue placeholder="Objective type" />
        </SelectTrigger>
        <SelectContent>
          {objectiveTypeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {/* Owner */}
    <div className="space-y-1">
      <Label htmlFor={`${idBase}-owner`} className="text-sm font-semibold">Owner</Label>
      <Input
        id={`${idBase}-owner`}
        placeholder="Owner (e.g., Product, Miguel, Growth)"
        value={value.owner ?? ""}
        onChange={(e) => update("owner", e.target.value)}
      />
    </div>
  </div>
)}
```

Also update the `ObjectiveEditor` in `design-ops-objectives.tsx`. The only change here is renaming the local state variable from `showAdvanced` to `showOptional`:

```tsx
// Change:
const [showAdvanced, setShowAdvanced] = useState(...)

// To:
const [showOptional, setShowOptional] = useState(
  Boolean(objective?.owner || objective?.type !== "product")
);
```

And update the two usages of the state variable in that component:
```tsx
// Change:
showAdvanced={showAdvanced}
onShowAdvancedChange={setShowAdvanced}

// To:
showAdvanced={showOptional}
onShowAdvancedChange={setShowOptional}
```

Note: the prop names `showAdvanced`/`onShowAdvancedChange` on `DesignOpsObjectiveFieldsProps` can stay as-is — only the local state variable name changes.

- [ ] **Step 4: Run test to confirm it passes**

```bash
node --test test/design-ops-layout.test.mjs
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/design/design-ops-objective-fields.tsx components/design/design-ops-objectives.tsx test/design-ops-layout.test.mjs
git commit -m "feat(design-ops): collapse optional fields behind Add context toggle"
```

---

## Task 3: Crew runner simplification

Replace the 3-card mode selector with a compact segmented toggle. Clean up all copy: remove jargon labels, agent name references, and UI elements that don't serve stakeholders.

**Files:**
- Modify: `components/design/design-ops-crew-runner.tsx`
- Modify: `test/design-ops-health-and-runner.test.mjs`

**What's being removed:**
- "Synthesis depth" label and 3-card grid
- "Use recommended prompt" button
- Deep dive reference prompt `<details>` block
- Mode guidance text (`getModePromptGuidance`)
- Dynamic run button label (`Run {mode.label}`)
- `getModePromptGuidance` import and usage
- `buildDeepDiveReferencePrompt` import and usage
- Toast: "Enter a focus prompt for Oracle"

**What's being added:**
- Compact segmented toggle (Quick / Balanced / Deep)
- Run button: "Run analysis" / "Analysis in progress..."
- Prompt label: "What do you want to understand?"
- Toast: "Add a question to continue"

- [ ] **Step 1: Update the test**

In `test/design-ops-health-and-runner.test.mjs`, update the "design ops runner" test.

**Remove these runner assertions** (they reference UI elements being deleted):
```js
assert.match(runner, /Synthesis depth/);
assert.match(runner, /Use recommended prompt/);
assert.match(runner, /Deep dive reference prompt/);
assert.match(runner, /getModePromptGuidance/);   // ← runner import only; keep the `prompts` assertion below
assert.match(runner, /Run \{\s*SYNTHESIS_MODES\.find/);
```

**Add these runner assertions:**
```js
assert.match(runner, /Run analysis/);
assert.match(runner, /Analysis in progress/);
assert.match(runner, /What do you want to understand\?/);
assert.match(runner, /shortLabel/);
assert.doesNotMatch(runner, /Synthesis depth/);
assert.doesNotMatch(runner, /Use recommended prompt/);
assert.doesNotMatch(runner, /Deep dive reference prompt/);
assert.doesNotMatch(runner, /getModePromptGuidance/);
assert.doesNotMatch(runner, /Enter a focus prompt for Oracle/);
```

**Keep these assertions unchanged** — do not remove them:
```js
assert.match(runner, /buildRecommendedPrompt/);     // still imported and used
assert.match(prompts, /getModePromptGuidance/);     // lib still exports it; runner just stops using it
assert.match(prompts, /buildDeepDiveReferencePrompt/); // lib still exports it
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
node --test test/design-ops-health-and-runner.test.mjs
```

Expected: FAIL on the removed assertions.

- [ ] **Step 3: Update `design-ops-crew-runner.tsx`**

**a) Add `shortLabel` to `SYNTHESIS_MODES`:**

```tsx
const SYNTHESIS_MODES: Array<{
  value: SynthesisMode;
  label: string;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "quick_read",
    label: "Quick read",
    shortLabel: "Quick",
    description: "Fast signal: recommendation, confidence, assumptions, next step.",
  },
  {
    value: "decision_memo",
    label: "Decision memo",
    shortLabel: "Balanced",
    description: "Balanced depth: recommendation, rationale, alternatives, and risks.",
  },
  {
    value: "deep_dive",
    label: "Deep dive",
    shortLabel: "Deep",
    description: "Full analysis: scenarios, evidence gaps, and richer tradeoffs.",
  },
];
```

**b) Remove unused imports:**

Remove `getModePromptGuidance` and `buildDeepDiveReferencePrompt` from the import line:

```tsx
import {
  buildRecommendedPrompt,
} from "@/lib/design-ops-prompts";
```

**c) Remove the `deepDiveReferencePrompt` useMemo** (lines ~72-75).

**d) Replace the mode selector UI** — remove the entire `<div>` block with `label "Synthesis depth"` and the card grid, replace with:

```tsx
<div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
  {SYNTHESIS_MODES.map((option) => (
    <button
      key={option.value}
      type="button"
      onClick={() => setMode(option.value)}
      disabled={running}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        mode === option.value
          ? "bg-background shadow-sm text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {option.shortLabel}
    </button>
  ))}
</div>
```

**e) Update the prompt field label** from `"Focus prompt"` to `"What do you want to understand?"`.

**f) Remove the elements below the textarea:**
- Remove `<p className="text-sm text-muted-foreground">{getModePromptGuidance(mode)}</p>`
- Remove the "Use recommended prompt" button `<div>`
- Remove the `deepDiveReferencePrompt` `<details>` block

**g) Update the toast error:**

```tsx
// Change:
toast.error("Enter a focus prompt for Oracle");
// To:
toast.error("Add a question to continue");
```

**h) Update the run button:**

```tsx
<Button onClick={handleRun} disabled={running || !prompt.trim() || !objective} className="w-full">
  {running ? (
    <>
      <Loader2 className="size-4 animate-spin mr-2" />
      Analysis in progress...
    </>
  ) : (
    <>
      <Play className="size-4 mr-2" />
      Run analysis
    </>
  )}
</Button>
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
node --test test/design-ops-health-and-runner.test.mjs
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/design/design-ops-crew-runner.tsx test/design-ops-health-and-runner.test.mjs
git commit -m "feat(design-ops): simplify run step — segmented toggle, plain copy, remove jargon"
```

---

## Task 4: Timeline debug gate

Remove the "Process details" section from the default view. Gate it behind `?debug=true` so it's only visible to admins who know to use it, not stakeholders.

**Files:**
- Modify: `components/design/design-ops-timeline.tsx`

No existing test covers the timeline's show/hide behavior. Write a new one.

- [ ] **Step 1: Create a new test file**

Create `test/design-ops-timeline-debug.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("design ops timeline gates process details behind debug param", () => {
  const timeline = read("components/design/design-ops-timeline.tsx");

  assert.match(timeline, /useSearchParams/);
  assert.match(timeline, /debug/);
  assert.doesNotMatch(timeline, /const \[showProcess, setShowProcess\] = useState/);
  assert.doesNotMatch(timeline, /setShowProcess\(/);
  assert.doesNotMatch(timeline, /"Show"\s*\n.*ChevronDown|"Hide"\s*\n.*ChevronDown/);
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
node --test test/design-ops-timeline-debug.test.mjs
```

Expected: FAIL — `useSearchParams` not present, `setShowProcess` still present.

- [ ] **Step 3: Update `design-ops-timeline.tsx`**

**a) Add import:**

```tsx
import { useSearchParams } from "next/navigation";
```

**b) Inside `DesignOpsTimeline`, replace the `useState` for `showProcess` with a search params read:**

```tsx
// Remove:
const [showProcess, setShowProcess] = useState(false);

// Add:
const searchParams = useSearchParams();
const showProcess = searchParams.get("debug") === "true";
```

**c) Replace the collapsible toggle button with a static non-interactive container** — since `showProcess` is now read-only from the URL, the toggle button is no longer needed. When debug is false, the section is hidden entirely. When debug is true, show it without a toggle:

```tsx
{processMessages.length > 0 && showProcess ? (
  <div className="rounded-xl border border-border/60 bg-card px-4 py-4">
    <div className="space-y-1 mb-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Process details
      </p>
      <p className="text-sm leading-6 text-muted-foreground">
        Internal agent choreography for transparency and debugging.
      </p>
    </div>
    <div className="space-y-3">
      {processMessages.map((msg, index) => (
        <ProcessStep key={`${msg.timestamp}-${index}`} msg={msg} />
      ))}
    </div>
  </div>
) : null}
```

Also remove the `ChevronDown` import if it's no longer used elsewhere in the file. Check by searching for other uses first.

- [ ] **Step 4: Run test to confirm it passes**

```bash
node --test test/design-ops-timeline-debug.test.mjs
```

Expected: PASS

- [ ] **Step 5: Run all design-ops tests to confirm nothing regressed**

```bash
node --test test/design-ops-layout.test.mjs test/design-ops-health-and-runner.test.mjs test/design-ops-timeline-debug.test.mjs test/design-ops-objectives-layout.test.mjs test/design-ops-archives.test.mjs test/design-ops-objectives-route.test.mjs test/design-ops-plain-text-formatting.test.mjs
```

Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add components/design/design-ops-timeline.tsx test/design-ops-timeline-debug.test.mjs
git commit -m "feat(design-ops): gate process details behind ?debug=true"
```
