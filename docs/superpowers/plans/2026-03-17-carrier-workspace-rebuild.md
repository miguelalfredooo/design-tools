# Carrier Workspace Rebuild Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing single-pane Design Ops UI with the new two-pane Carrier workspace — fixed 220px rail + flex main pane, spine nav, shared/private view toggle, Results step with RunCards and InsightCards, and Design Ops accordion — leaving all data layer files untouched.

**Architecture:** `CarrierShell` is the single client component that owns all state; it calls `useDesignOpsWorkspace()` and passes derived props down to `CarrierRail` and `CarrierMainPane`. View state (private/shared) lives in the URL param `?view=shared`, read via `useSearchParams` in `CarrierShell`. All semantic colors are CSS custom properties in `:root` — no hex values in component files.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui (Card, Badge, Button, Collapsible, Sheet, Separator, Skeleton — all already installed), Lucide React, Sonner (toast), `node:test` for structural tests.

**Spec:** `docs/superpowers/specs/2026-03-17-carrier-workspace-redesign.md`

---

## Important constraints

- **No worktrees, no feature branches** — work directly on `main` per project convention.
- **`.do-*` CSS classes must be kept** — `design-ops-crew-runner.tsx` and `design-ops-objectives.tsx` (both "kept unchanged") still reference them. Do not remove `.do-*` classes from `globals.css`.
- **`scroll-area` is not yet installed** — use `overflow-y-auto` directly on the scroll container instead of `<ScrollArea>` from shadcn. This avoids adding a dependency.
- **Tests are structural** (file content checks) using the project's `node:test` pattern. No runtime tests needed for UI.
- **Run tests with:** `node --test test/<file>.test.mjs`

---

## File map

### Create
```
lib/carrier-types.ts                          — StepId, StatusId, SpineStep, Insight, SummaryData types
components/design/carrier-shell.tsx           — root layout, owns all state, 'use client'
components/design/carrier-rail.tsx            — 220px fixed left rail
components/design/spine-nav.tsx               — ordered step list with status dots
components/design/session-history.tsx         — past sessions list at bottom of rail
components/design/carrier-topbar.tsx          — private/shared toggle + copy link button
components/design/carrier-main-pane.tsx       — right flex pane, routes to step components
components/design/step-objective.tsx          — wraps existing DesignOpsObjectives
components/design/step-analysis.tsx           — wraps existing DesignOpsCrewRunner
components/design/summary-strip.tsx           — 5-metric grid shown above fold in Results
components/design/new-run-card.tsx            — dashed CTA card, navigates to Analysis step
components/design/run-card.tsx                — archive card with Sheet detail view
components/design/insight-card.tsx            — typed (risk/opportunity/pattern) collapsible card
components/design/step-results.tsx            — Results step: SummaryStrip + RunCards + InsightCards
components/design/design-ops-module.tsx       — single Design Ops module row (collapsible)
components/design/step-design-ops.tsx         — Design Ops step: accordion list of modules
```

### Modify
```
app/globals.css              — add --color-status-* and --color-insight-* tokens to :root
app/design-ops/page.tsx      — swap DesignOpsClient for CarrierShell
```

### Delete (after all new components are wired up in Task 10)
```
components/design/design-ops-client.tsx
components/design/design-ops-archive-list.tsx
components/design/design-ops-active-objective-summary.tsx
```

---

## Task 1: Color tokens and carrier types

**Files:**
- Modify: `app/globals.css` (add 14 tokens to first `:root` block, around line 121)
- Create: `lib/carrier-types.ts`
- Create: `test/carrier-workspace-foundation.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// test/carrier-workspace-foundation.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("globals.css has --color-status-* tokens in :root", () => {
  const css = read("app/globals.css");
  assert.match(css, /--color-status-complete:/);
  assert.match(css, /--color-status-complete-bg:/);
  assert.match(css, /--color-status-progress:/);
  assert.match(css, /--color-status-progress-bg:/);
  assert.match(css, /--color-status-blocked:/);
  assert.match(css, /--color-status-blocked-bg:/);
  assert.match(css, /--color-status-idle:/);
  assert.match(css, /--color-status-idle-bg:/);
});

test("globals.css has --color-insight-* tokens in :root", () => {
  const css = read("app/globals.css");
  assert.match(css, /--color-insight-risk-bg:/);
  assert.match(css, /--color-insight-risk-text:/);
  assert.match(css, /--color-insight-opportunity-bg:/);
  assert.match(css, /--color-insight-opportunity-text:/);
  assert.match(css, /--color-insight-pattern-bg:/);
  assert.match(css, /--color-insight-pattern-text:/);
});

test("carrier-types.ts exports all required types and constants", () => {
  const src = read("lib/carrier-types.ts");
  assert.match(src, /export type StepId/);
  assert.match(src, /export type StatusId/);
  assert.match(src, /export const STATUS_LABELS/);
  assert.match(src, /export type SpineStep/);
  assert.match(src, /export type InsightType/);
  assert.match(src, /export type Insight/);
  assert.match(src, /export type SummaryData/);
});

test("carrier-types.ts SpineStep includes blockedReason", () => {
  const src = read("lib/carrier-types.ts");
  assert.match(src, /blockedReason/);
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
node --test test/carrier-workspace-foundation.test.mjs
```
Expected: 4 failures (files don't exist yet)

- [ ] **Step 3: Add color tokens to `app/globals.css`**

Find the closing `}` of the first `:root` block (the one with `--color-sidebar-ring`, around line 121). Insert before the `}`:

```css
  /* Carrier — status indicator tokens */
  --color-status-complete:     #3B6D11;
  --color-status-complete-bg:  #EAF3DE;
  --color-status-progress:     #854F0B;
  --color-status-progress-bg:  #FAEEDA;
  --color-status-blocked:      #A32D2D;
  --color-status-blocked-bg:   #FCEBEB;
  --color-status-idle:         #888780;
  --color-status-idle-bg:      #F1EFE8;

  /* Carrier — insight card type tokens */
  --color-insight-risk-bg:            #FCEBEB;
  --color-insight-risk-text:          #A32D2D;
  --color-insight-opportunity-bg:     #EAF3DE;
  --color-insight-opportunity-text:   #3B6D11;
  --color-insight-pattern-bg:         #E1F5EE;
  --color-insight-pattern-text:       #0F6E56;
```

- [ ] **Step 4: Create `lib/carrier-types.ts`**

```ts
export type StepId = 'objective' | 'analysis' | 'results' | 'design-ops'

export type StatusId = 'not_started' | 'in_progress' | 'complete' | 'blocked'

export const STATUS_LABELS: Record<StatusId, string> = {
  not_started: 'Not started',
  in_progress:  'In progress',
  complete:     'Complete',
  blocked:      'Blocked',
}

export type SpineStep = {
  id:             StepId
  label:          string
  status:         StatusId
  blockedReason?: string
}

export type InsightType = 'risk' | 'opportunity' | 'pattern'

export type Insight = {
  id:      string
  type:    InsightType
  text:    string
  source:  string
  detail?: string
}

export type SummaryData = {
  confidence:     'high' | 'medium' | 'low' | null
  participants:   number | null
  insights:       number
  recommendation: string
  nextSteps:      string
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
node --test test/carrier-workspace-foundation.test.mjs
```
Expected: 4 passing

- [ ] **Step 6: Commit**

```bash
git add app/globals.css lib/carrier-types.ts test/carrier-workspace-foundation.test.mjs
git commit -m "feat: add carrier color tokens and types"
```

---

## Task 2: CarrierShell + page.tsx entry point

**Files:**
- Create: `components/design/carrier-shell.tsx`
- Modify: `app/design-ops/page.tsx`
- Create: `test/carrier-shell.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// test/carrier-shell.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("carrier-shell has 'use client' directive", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /'use client'/);
});

test("carrier-shell uses useSearchParams and useRouter", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /useSearchParams/);
  assert.match(src, /useRouter/);
});

test("carrier-shell calls useDesignOpsWorkspace", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /useDesignOpsWorkspace/);
});

test("carrier-shell derives steps SpineStep array", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /SpineStep/);
  assert.match(src, /not_started/);
  assert.match(src, /in_progress/);
  assert.match(src, /complete/);
});

test("carrier-shell defines onViewChange that calls router.replace", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /onViewChange/);
  assert.match(src, /router\.replace/);
});

test("carrier-shell defines onNavigateToAnalysis and onRunComplete", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /onNavigateToAnalysis/);
  assert.match(src, /onRunComplete/);
});

test("carrier-shell defines onNewSession that resets state", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /onNewSession/);
  assert.match(src, /setActiveObjectiveId/);
  assert.match(src, /setMessages/);
});

test("carrier-shell derives sessions list from archives", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /sessionList/);
  assert.match(src, /archives/);
});

test("carrier-shell renders CarrierRail and CarrierMainPane", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /CarrierRail/);
  assert.match(src, /CarrierMainPane/);
});

test("carrier-shell root element is full-height flex row", () => {
  const src = read("components/design/carrier-shell.tsx");
  assert.match(src, /h-screen/);
  assert.match(src, /overflow-hidden/);
});

test("page.tsx uses CarrierShell inside Suspense", () => {
  const src = read("app/design-ops/page.tsx");
  assert.match(src, /CarrierShell/);
  assert.match(src, /Suspense/);
  assert.doesNotMatch(src, /DesignOpsClient/);
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
node --test test/carrier-shell.test.mjs
```
Expected: 11 failures

- [ ] **Step 3: Create `components/design/carrier-shell.tsx`**

```tsx
'use client'

import { useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useDesignOpsWorkspace } from '@/hooks/use-design-ops-workspace'
import { CarrierRail } from './carrier-rail'
import { CarrierMainPane } from './carrier-main-pane'
import { type StepId, type StatusId, type SpineStep } from '@/lib/carrier-types'
import { toast } from 'sonner'

export function CarrierShell() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') === 'shared' ? 'shared' : 'private') as 'private' | 'shared'

  const {
    objectives, activeObjectiveId, activeObjective,
    messages, archives, running, loading,
    currentRunMode,
    setActiveObjectiveId, setMessages, setRunning, setCurrentRunMode,
    addObjective, updateObjective, deleteObjective,
    deleteArchive, archiveRun,
  } = useDesignOpsWorkspace()

  // Derive steps
  const steps: SpineStep[] = useMemo(() => {
    const objectiveStatus: StatusId = activeObjective !== null ? 'complete' : 'not_started'
    const analysisStatus: StatusId = running
      ? 'in_progress'
      : archives.length > 0
      ? 'complete'
      : 'not_started'
    const resultsStatus: StatusId =
      archives.length > 0 || messages.length > 0 ? 'in_progress' : 'not_started'
    return [
      { id: 'objective',  label: 'Objective',   status: objectiveStatus },
      { id: 'analysis',   label: 'Analysis',    status: analysisStatus },
      { id: 'results',    label: 'Results',     status: resultsStatus },
      { id: 'design-ops', label: 'Design Ops',  status: 'not_started' },
    ]
  }, [activeObjective, running, archives, messages])

  // Initial step: first incomplete step (design-ops never auto-lands)
  const initialStep = useMemo((): StepId => {
    if (steps[0].status === 'not_started') return 'objective'
    if (steps[1].status === 'not_started') return 'analysis'
    return 'results'
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [activeStep, setActiveStep] = useState<StepId>(initialStep)

  const onViewChange = (v: 'private' | 'shared') => {
    const params = new URLSearchParams(searchParams.toString())
    if (v === 'shared') { params.set('view', 'shared') } else { params.delete('view') }
    router.replace(`?${params.toString()}`)
  }

  const onNewSession = () => {
    setActiveObjectiveId(null)
    setMessages([])
    setActiveStep('objective')
  }

  const onNavigateToAnalysis = () => setActiveStep('analysis')

  const onRunComplete = async (payload: Parameters<typeof archiveRun>[0]) => {
    await archiveRun(payload)
    toast.success('Analysis complete', {
      action: {
        label: 'View results',
        onClick: () => setActiveStep('results'),
      },
    })
  }

  // Derive session list from archives (grouped by first objective id)
  const sessionList = useMemo(() => {
    const map = new Map<string, { id: string; title: string; status: StatusId }>()
    for (const a of archives) {
      if (!a.objectives?.length) continue
      const objId = a.objectives[0].id
      if (!map.has(objId)) {
        map.set(objId, {
          id: objId,
          title: a.objectives[0].title ?? 'Untitled session',
          status: 'complete',
        })
      }
    }
    return Array.from(map.values())
  }, [archives])

  return (
    <div className="flex h-screen overflow-hidden">
      <CarrierRail
        activeStep={activeStep}
        steps={steps}
        onStepChange={setActiveStep}
        onNewSession={onNewSession}
        activeObjective={activeObjective}
        sessions={sessionList}
      />
      <CarrierMainPane
        activeStep={activeStep}
        view={view}
        onViewChange={onViewChange}
        onNavigateToAnalysis={onNavigateToAnalysis}
        onRunComplete={onRunComplete}
        objectives={objectives}
        activeObjectiveId={activeObjectiveId}
        activeObjective={activeObjective}
        messages={messages}
        archives={archives}
        running={running}
        loading={loading}
        currentRunMode={currentRunMode}
        setActiveObjectiveId={setActiveObjectiveId}
        setMessages={setMessages}
        setRunning={setRunning}
        setCurrentRunMode={setCurrentRunMode}
        addObjective={addObjective}
        updateObjective={updateObjective}
        deleteObjective={deleteObjective}
        deleteArchive={deleteArchive}
      />
    </div>
  )
}
```

- [ ] **Step 4: Update `app/design-ops/page.tsx`**

```tsx
import { Suspense } from 'react'
import { CarrierShell } from '@/components/design/carrier-shell'

export default function DesignOpsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted-foreground">Loading...</div>}>
      <CarrierShell />
    </Suspense>
  )
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
node --test test/carrier-shell.test.mjs
```
Expected: 11 passing

- [ ] **Step 6: Commit**

```bash
git add components/design/carrier-shell.tsx app/design-ops/page.tsx test/carrier-shell.test.mjs
git commit -m "feat: add CarrierShell and update page entry point"
```

---

## Task 3: CarrierRail, SpineNav, SessionHistory

**Files:**
- Create: `components/design/spine-nav.tsx`
- Create: `components/design/session-history.tsx`
- Create: `components/design/carrier-rail.tsx`
- Create: `test/carrier-rail.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// test/carrier-rail.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("spine-nav renders each step with dot color from CSS var", () => {
  const src = read("components/design/spine-nav.tsx");
  assert.match(src, /var\(--color-status-/);
  assert.match(src, /rounded-full/);
});

test("spine-nav applies left border accent to active step", () => {
  const src = read("components/design/spine-nav.tsx");
  assert.match(src, /border-l-\[2\.5px\]/);
  assert.match(src, /isActive/);
});

test("spine-nav shows Badge for in_progress and blocked states", () => {
  const src = read("components/design/spine-nav.tsx");
  assert.match(src, /in_progress/);
  assert.match(src, /blocked/);
  assert.match(src, /Badge/);
});

test("spine-nav calls onStepChange on click", () => {
  const src = read("components/design/spine-nav.tsx");
  assert.match(src, /onStepChange/);
  assert.match(src, /onClick/);
});

test("session-history renders each session with status dot", () => {
  const src = read("components/design/session-history.tsx");
  assert.match(src, /status/);
  assert.match(src, /var\(--color-status-/);
  assert.match(src, /rounded-full/);
});

test("session-history calls onSelect on click", () => {
  const src = read("components/design/session-history.tsx");
  assert.match(src, /onSelect/);
  assert.match(src, /onClick/);
});

test("carrier-rail is 220px wide with border-r", () => {
  const src = read("components/design/carrier-rail.tsx");
  assert.match(src, /w-\[220px\]/);
  assert.match(src, /border-r/);
});

test("carrier-rail renders SpineNav and SessionHistory", () => {
  const src = read("components/design/carrier-rail.tsx");
  assert.match(src, /SpineNav/);
  assert.match(src, /SessionHistory/);
});

test("carrier-rail renders New session button", () => {
  const src = read("components/design/carrier-rail.tsx");
  assert.match(src, /New session/);
  assert.match(src, /Button/);
  assert.match(src, /onNewSession/);
});

test("carrier-rail shows activeObjective title or fallback", () => {
  const src = read("components/design/carrier-rail.tsx");
  assert.match(src, /activeObjective/);
  assert.match(src, /No active session/);
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
node --test test/carrier-rail.test.mjs
```
Expected: 10 failures

- [ ] **Step 3: Create `components/design/spine-nav.tsx`**

```tsx
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS, type SpineStep, type StepId, type StatusId } from '@/lib/carrier-types'

const dotColor: Record<StatusId, string> = {
  complete:    'var(--color-status-complete)',
  in_progress: 'var(--color-status-progress)',
  blocked:     'var(--color-status-blocked)',
  not_started: 'var(--color-border)',
}

interface SpineNavProps {
  steps: SpineStep[]
  activeStepId: StepId
  onStepChange: (id: StepId) => void
}

export function SpineNav({ steps, activeStepId, onStepChange }: SpineNavProps) {
  return (
    <div className="flex flex-col py-2">
      {steps.map((step, i) => {
        const isActive = step.id === activeStepId
        const isLast = i === steps.length - 1
        const isMuted = step.status === 'not_started' && !isActive
        return (
          <div
            key={step.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50',
              isActive && 'border-l-[2.5px] border-foreground bg-background pl-[14px]'
            )}
            onClick={() => onStepChange(step.id)}
          >
            {/* Connector column */}
            <div className="flex flex-col items-center pt-1 shrink-0" style={{ width: '10px' }}>
              <div
                className="size-[7px] rounded-full shrink-0"
                style={{ background: dotColor[step.status] }}
              />
              {!isLast && <div className="w-px flex-1 bg-border mt-1" style={{ minHeight: '24px' }} />}
            </div>
            {/* Content column */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={cn('text-sm font-medium', isMuted && 'text-muted-foreground')}>
                  {step.label}
                </p>
                {(step.status === 'in_progress' || step.status === 'blocked') && (
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 h-auto shrink-0"
                    style={{
                      color:            `var(--color-status-${step.status === 'in_progress' ? 'progress' : 'blocked'})`,
                      borderColor:      `var(--color-status-${step.status === 'in_progress' ? 'progress' : 'blocked'})`,
                      backgroundColor:  `var(--color-status-${step.status === 'in_progress' ? 'progress' : 'blocked'}-bg)`,
                    }}
                  >
                    {STATUS_LABELS[step.status]}
                  </Badge>
                )}
              </div>
              {step.status === 'blocked' && step.blockedReason && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-status-blocked)' }}>
                  {step.blockedReason}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Create `components/design/session-history.tsx`**

```tsx
import { cn } from '@/lib/utils'
import { type StatusId } from '@/lib/carrier-types'

const dotColor: Record<StatusId, string> = {
  complete:    'var(--color-status-complete)',
  in_progress: 'var(--color-status-progress)',
  blocked:     'var(--color-status-blocked)',
  not_started: 'var(--color-status-idle)',
}

interface SessionHistoryProps {
  sessions: Array<{ id: string; title: string; status: StatusId }>
  onSelect: (id: string) => void
}

export function SessionHistory({ sessions, onSelect }: SessionHistoryProps) {
  if (sessions.length === 0) return null
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
        History
      </p>
      <div className="space-y-0.5">
        {sessions.map(s => (
          <div
            key={s.id}
            className="flex items-center gap-2 py-1.5 cursor-pointer hover:text-foreground transition-colors"
            onClick={() => onSelect(s.id)}
          >
            <div
              className="size-[6px] rounded-full shrink-0"
              style={{ background: dotColor[s.status] }}
            />
            <p className="text-sm text-muted-foreground truncate">{s.title}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `components/design/carrier-rail.tsx`**

```tsx
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SpineNav } from './spine-nav'
import { SessionHistory } from './session-history'
import { type StepId, type StatusId, type SpineStep } from '@/lib/carrier-types'
import { type Objective } from '@/lib/design-ops-types'

interface CarrierRailProps {
  activeStep: StepId
  steps: SpineStep[]
  onStepChange: (id: StepId) => void
  onNewSession: () => void
  activeObjective: Objective | null
  sessions: Array<{ id: string; title: string; status: StatusId }>
}

export function CarrierRail({
  activeStep, steps, onStepChange, onNewSession, activeObjective, sessions,
}: CarrierRailProps) {
  return (
    <div className="w-[220px] shrink-0 flex flex-col border-r h-full">
      {/* Session context */}
      <div className="p-4 border-b">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
          Session
        </p>
        <p className="text-sm font-medium truncate">
          {activeObjective?.title ?? 'No active session'}
        </p>
      </div>

      {/* New session */}
      <div className="px-4 py-3 border-b">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onNewSession}
        >
          <Plus className="size-4" />
          New session
        </Button>
      </div>

      {/* Spine nav — flex-1, scrollable */}
      <div className="flex-1 overflow-y-auto">
        <SpineNav steps={steps} activeStepId={activeStep} onStepChange={onStepChange} />
      </div>

      {/* History */}
      <div className="mt-auto border-t p-4">
        <SessionHistory sessions={sessions} onSelect={() => {}} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests — confirm they pass**

```bash
node --test test/carrier-rail.test.mjs
```
Expected: 10 passing

- [ ] **Step 7: Commit**

```bash
git add components/design/spine-nav.tsx components/design/session-history.tsx components/design/carrier-rail.tsx test/carrier-rail.test.mjs
git commit -m "feat: add CarrierRail, SpineNav, SessionHistory"
```

---

## Task 4: CarrierTopbar

**Files:**
- Create: `components/design/carrier-topbar.tsx`
- Create: `test/carrier-topbar.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// test/carrier-topbar.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("carrier-topbar renders Private and Shared buttons", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /Private/);
  assert.match(src, /Shared/);
  assert.match(src, /Button/);
});

test("carrier-topbar Private button calls onViewChange with private", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /onViewChange\('private'\)/);
});

test("carrier-topbar Shared button calls onViewChange with shared", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /onViewChange\('shared'\)/);
});

test("carrier-topbar Copy share link button builds URL with view=shared", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /Copy share link/);
  assert.match(src, /view.*shared/);
  assert.match(src, /clipboard/);
});

test("carrier-topbar Copy share link shows toast on click", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /toast/);
  assert.match(src, /Link copied/);
});

test("carrier-topbar has border-b and flex layout", () => {
  const src = read("components/design/carrier-topbar.tsx");
  assert.match(src, /border-b/);
  assert.match(src, /flex/);
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
node --test test/carrier-topbar.test.mjs
```
Expected: 6 failures

- [ ] **Step 3: Create `components/design/carrier-topbar.tsx`**

```tsx
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CarrierTopbarProps {
  view: 'private' | 'shared'
  onViewChange: (v: 'private' | 'shared') => void
}

export function CarrierTopbar({ view, onViewChange }: CarrierTopbarProps) {
  return (
    <div className="flex items-center justify-between border-b px-5 py-3 shrink-0">
      {/* View toggle */}
      <div className="flex bg-muted rounded-md p-0.5 gap-0.5">
        <Button
          variant={view === 'private' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('private')}
        >
          Private
        </Button>
        <Button
          variant={view === 'shared' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewChange('shared')}
        >
          Shared
        </Button>
      </div>

      {/* Copy share link */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const url = new URL(window.location.href)
          url.searchParams.set('view', 'shared')
          navigator.clipboard.writeText(url.toString())
          toast.success('Link copied')
        }}
      >
        Copy share link
      </Button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
node --test test/carrier-topbar.test.mjs
```
Expected: 6 passing

- [ ] **Step 5: Commit**

```bash
git add components/design/carrier-topbar.tsx test/carrier-topbar.test.mjs
git commit -m "feat: add CarrierTopbar with view toggle and copy link"
```

---

## Task 5: CarrierMainPane + StepObjective + StepAnalysis

**Files:**
- Create: `components/design/carrier-main-pane.tsx`
- Create: `components/design/step-objective.tsx`
- Create: `components/design/step-analysis.tsx`
- Create: `test/carrier-main-pane.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// test/carrier-main-pane.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("carrier-main-pane renders CarrierTopbar", () => {
  const src = read("components/design/carrier-main-pane.tsx");
  assert.match(src, /CarrierTopbar/);
  assert.match(src, /onViewChange/);
});

test("carrier-main-pane renders all four step components conditionally", () => {
  const src = read("components/design/carrier-main-pane.tsx");
  assert.match(src, /StepObjective/);
  assert.match(src, /StepAnalysis/);
  assert.match(src, /StepResults/);
  assert.match(src, /StepDesignOps/);
  assert.match(src, /activeStep.*objective/);
  assert.match(src, /activeStep.*analysis/);
  assert.match(src, /activeStep.*results/);
  assert.match(src, /activeStep.*design-ops/);
});

test("carrier-main-pane passes onNavigateToAnalysis to StepResults", () => {
  const src = read("components/design/carrier-main-pane.tsx");
  assert.match(src, /onNavigateToAnalysis/);
});

test("carrier-main-pane passes onRunComplete to StepAnalysis", () => {
  const src = read("components/design/carrier-main-pane.tsx");
  assert.match(src, /onRunComplete/);
});

test("carrier-main-pane has flex-1 and overflow-hidden", () => {
  const src = read("components/design/carrier-main-pane.tsx");
  assert.match(src, /flex-1/);
  assert.match(src, /overflow-hidden/);
});

test("step-objective wraps DesignOpsObjectives", () => {
  const src = read("components/design/step-objective.tsx");
  assert.match(src, /DesignOpsObjectives/);
});

test("step-analysis wraps DesignOpsCrewRunner", () => {
  const src = read("components/design/step-analysis.tsx");
  assert.match(src, /DesignOpsCrewRunner/);
});

test("step-analysis passes onRunComplete from props", () => {
  const src = read("components/design/step-analysis.tsx");
  assert.match(src, /onRunComplete/);
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
node --test test/carrier-main-pane.test.mjs
```
Expected: 8 failures

- [ ] **Step 3: Create `components/design/step-objective.tsx`**

```tsx
import { DesignOpsObjectives } from './design-ops-objectives'
import { type Objective } from '@/lib/design-ops-types'

interface StepObjectiveProps {
  objectives: Objective[]
  activeObjectiveId: string | null
  onActiveObjectiveChange: (id: string | null) => void
  onAdd: (obj: Omit<Objective, 'id' | 'createdAt'>) => Promise<Objective | null>
  onUpdate: (id: string, updates: Omit<Objective, 'id' | 'createdAt'>) => Promise<Objective | null>
  onDelete: (id: string) => void
}

export function StepObjective(props: StepObjectiveProps) {
  return (
    <DesignOpsObjectives
      objectives={props.objectives}
      activeObjectiveId={props.activeObjectiveId}
      onActiveObjectiveChange={props.onActiveObjectiveChange}
      onAdd={props.onAdd}
      onUpdate={props.onUpdate}
      onDelete={props.onDelete}
    />
  )
}
```

- [ ] **Step 4: Create `components/design/step-analysis.tsx`**

Check the props signature of `DesignOpsCrewRunner` before writing this step. Run:
```bash
grep -n "interface\|Props\|prop\b" /Users/miguelarias/cafemedia/design/carrier/components/design/design-ops-crew-runner.tsx | head -20
```
Then write the wrapper to match:

```tsx
import { DesignOpsCrewRunner } from './design-ops-crew-runner'
import { type Objective, type AgentMessage, type SynthesisMode } from '@/lib/design-ops-types'

interface StepAnalysisProps {
  objective: Objective | null
  onMessages: (msgs: AgentMessage[]) => void
  onRunStatusChange: (running: boolean) => void
  onModeChange: (mode: SynthesisMode) => void
  onRunComplete: (payload: {
    prompt: string
    mode: SynthesisMode
    objectives: Objective[]
    messages: AgentMessage[]
    provider?: string
    model?: string
  }) => void
}

export function StepAnalysis(props: StepAnalysisProps) {
  return (
    <DesignOpsCrewRunner
      objective={props.objective}
      onMessages={props.onMessages}
      onRunStatusChange={props.onRunStatusChange}
      onModeChange={props.onModeChange}
      onRunComplete={props.onRunComplete}
    />
  )
}
```

> **Note:** Verify the exact prop names from `DesignOpsCrewRunner` before writing this — the grep above will show you. If prop names differ, match them exactly.

- [ ] **Step 5: Create `components/design/carrier-main-pane.tsx`**

```tsx
import { CarrierTopbar } from './carrier-topbar'
import { StepObjective } from './step-objective'
import { StepAnalysis } from './step-analysis'
import { StepResults } from './step-results'
import { StepDesignOps } from './step-design-ops'
import { type StepId } from '@/lib/carrier-types'
import {
  type Objective, type AgentMessage, type DesignOpsArchive, type SynthesisMode,
} from '@/lib/design-ops-types'

interface CarrierMainPaneProps {
  activeStep: StepId
  view: 'private' | 'shared'
  onViewChange: (v: 'private' | 'shared') => void
  onNavigateToAnalysis: () => void
  onRunComplete: (payload: {
    prompt: string; mode: SynthesisMode; objectives: Objective[]
    messages: AgentMessage[]; provider?: string; model?: string
  }) => void
  objectives: Objective[]
  activeObjectiveId: string | null
  activeObjective: Objective | null
  messages: AgentMessage[]
  archives: DesignOpsArchive[]
  running: boolean
  loading: boolean
  currentRunMode: SynthesisMode
  setActiveObjectiveId: (id: string | null) => void
  setMessages: (msgs: AgentMessage[]) => void
  setRunning: (r: boolean) => void
  setCurrentRunMode: (m: SynthesisMode) => void
  addObjective: (obj: Omit<Objective, 'id' | 'createdAt'>) => Promise<Objective | null>
  updateObjective: (id: string, updates: Omit<Objective, 'id' | 'createdAt'>) => Promise<Objective | null>
  deleteObjective: (id: string) => void
  deleteArchive: (id: string) => void
}

export function CarrierMainPane({
  activeStep, view, onViewChange, onNavigateToAnalysis, onRunComplete,
  objectives, activeObjectiveId, activeObjective, messages, archives,
  running, loading, currentRunMode,
  setActiveObjectiveId, setMessages, setRunning, setCurrentRunMode,
  addObjective, updateObjective, deleteObjective, deleteArchive,
}: CarrierMainPaneProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <CarrierTopbar view={view} onViewChange={onViewChange} />
      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          {activeStep === 'objective' && (
            <StepObjective
              objectives={objectives}
              activeObjectiveId={activeObjectiveId}
              onActiveObjectiveChange={setActiveObjectiveId}
              onAdd={addObjective}
              onUpdate={updateObjective}
              onDelete={deleteObjective}
            />
          )}
          {activeStep === 'analysis' && (
            <StepAnalysis
              objective={activeObjective}
              onMessages={setMessages}
              onRunStatusChange={setRunning}
              onModeChange={setCurrentRunMode}
              onRunComplete={onRunComplete}
            />
          )}
          {activeStep === 'results' && (
            <StepResults
              archives={archives}
              messages={messages}
              running={running}
              view={view}
              onDeleteArchive={deleteArchive}
              onNavigateToAnalysis={onNavigateToAnalysis}
            />
          )}
          {activeStep === 'design-ops' && <StepDesignOps />}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Run tests — confirm they pass**

```bash
node --test test/carrier-main-pane.test.mjs
```
Expected: 8 passing

- [ ] **Step 7: Commit**

```bash
git add components/design/carrier-main-pane.tsx components/design/step-objective.tsx components/design/step-analysis.tsx test/carrier-main-pane.test.mjs
git commit -m "feat: add CarrierMainPane, StepObjective, StepAnalysis"
```

---

## Task 6: SummaryStrip + NewRunCard

**Files:**
- Create: `components/design/summary-strip.tsx`
- Create: `components/design/new-run-card.tsx`
- Create: `test/carrier-results-components.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// test/carrier-results-components.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("summary-strip renders SummaryData fields", () => {
  const src = read("components/design/summary-strip.tsx");
  assert.match(src, /confidence/);
  assert.match(src, /participants/);
  assert.match(src, /insights/);
  assert.match(src, /recommendation/);
  assert.match(src, /nextSteps/);
});

test("summary-strip renders null values as em dash", () => {
  const src = read("components/design/summary-strip.tsx");
  assert.match(src, /—/);
});

test("summary-strip applies confidence color from CSS var", () => {
  const src = read("components/design/summary-strip.tsx");
  assert.match(src, /var\(--color-status-/);
  assert.match(src, /confidence/);
});

test("summary-strip uses grid layout with Card tiles", () => {
  const src = read("components/design/summary-strip.tsx");
  assert.match(src, /grid/);
  assert.match(src, /Card/);
  assert.match(src, /text-muted-foreground/);
});

test("new-run-card has dashed border and calls onNewRun on click", () => {
  const src = read("components/design/new-run-card.tsx");
  assert.match(src, /border-dashed/);
  assert.match(src, /onNewRun/);
  assert.match(src, /onClick/);
});

test("new-run-card renders Plus icon and New run label", () => {
  const src = read("components/design/new-run-card.tsx");
  assert.match(src, /Plus/);
  assert.match(src, /New run/);
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
node --test test/carrier-results-components.test.mjs
```
Expected: 6 failures

- [ ] **Step 3: Create `components/design/summary-strip.tsx`**

```tsx
import { Card } from '@/components/ui/card'
import { type SummaryData } from '@/lib/carrier-types'

const confidenceColor = (c: SummaryData['confidence']) => {
  if (c === 'high')   return 'var(--color-status-complete)'
  if (c === 'medium') return 'var(--color-status-progress)'
  if (c === 'low')    return 'var(--color-status-blocked)'
  return undefined
}

interface SummaryStripProps { summary: SummaryData }

export function SummaryStrip({ summary }: SummaryStripProps) {
  const tiles = [
    {
      label: 'Confidence',
      value: summary.confidence
        ? summary.confidence.charAt(0).toUpperCase() + summary.confidence.slice(1)
        : '—',
      color: confidenceColor(summary.confidence),
    },
    {
      label: 'Participants',
      value: summary.participants !== null ? String(summary.participants) : '—',
    },
    {
      label: 'Insights',
      value: summary.insights > 0 ? String(summary.insights) : '—',
    },
    {
      label: 'Recommendation',
      value: summary.recommendation || '—',
      wide: true,
    },
    {
      label: 'Next steps',
      value: summary.nextSteps || '—',
      wide: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {tiles.map(tile => (
        <Card
          key={tile.label}
          className={`p-4 ${tile.wide ? 'lg:col-span-1' : ''}`}
        >
          <p className="text-xs text-muted-foreground font-medium mb-1">{tile.label}</p>
          <p
            className="text-base font-medium"
            style={tile.color ? { color: tile.color } : undefined}
          >
            {tile.value}
          </p>
        </Card>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create `components/design/new-run-card.tsx`**

```tsx
import { Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface NewRunCardProps { onNewRun: () => void }

export function NewRunCard({ onNewRun }: NewRunCardProps) {
  return (
    <Card
      className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onNewRun}
    >
      <CardContent className="flex items-center gap-4 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
          <Plus className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">New run</p>
          <p className="text-sm text-muted-foreground">
            Run a new analysis against the active objective
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
node --test test/carrier-results-components.test.mjs
```
Expected: 6 passing

- [ ] **Step 6: Commit**

```bash
git add components/design/summary-strip.tsx components/design/new-run-card.tsx test/carrier-results-components.test.mjs
git commit -m "feat: add SummaryStrip and NewRunCard"
```

---

## Task 7: RunCard

**Files:**
- Create: `components/design/run-card.tsx`
- Extend: `test/carrier-results-components.test.mjs`

Before implementing, check the imports available in `design-ops-timeline.tsx` and `design-ops-findings-summary.tsx` to confirm prop names:
```bash
grep -n "interface\|Props\b\|export function" \
  /Users/miguelarias/cafemedia/design/carrier/components/design/design-ops-timeline.tsx \
  /Users/miguelarias/cafemedia/design/carrier/components/design/design-ops-findings-summary.tsx \
  | head -20
```

- [ ] **Step 1: Append tests to `test/carrier-results-components.test.mjs`**

```js
test("run-card renders archive prompt and metadata", () => {
  const src = read("components/design/run-card.tsx");
  assert.match(src, /archive\.prompt/);
  assert.match(src, /archive\.createdAt/);
  assert.match(src, /archive\.mode/);
});

test("run-card confidence badge uses CSS var colors", () => {
  const src = read("components/design/run-card.tsx");
  assert.match(src, /var\(--color-status-/);
  assert.match(src, /Badge/);
});

test("run-card opens Sheet on click and shows DesignOpsTimeline or DesignOpsFindingsSummary", () => {
  const src = read("components/design/run-card.tsx");
  assert.match(src, /Sheet/);
  assert.match(src, /DesignOpsTimeline/);
  assert.match(src, /DesignOpsFindingsSummary/);
  assert.match(src, /view.*private/);
});

test("run-card delete triggers onDelete", () => {
  const src = read("components/design/run-card.tsx");
  assert.match(src, /onDelete/);
});
```

- [ ] **Step 2: Run tests — confirm new tests fail**

```bash
node --test test/carrier-results-components.test.mjs
```
Expected: 4 new failures

- [ ] **Step 3: Create `components/design/run-card.tsx`**

```tsx
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { DesignOpsTimeline } from './design-ops-timeline'
import { DesignOpsFindingsSummary } from './design-ops-findings-summary'
import { type DesignOpsArchive } from '@/lib/design-ops-types'

const MODE_LABELS: Record<string, string> = {
  quick_read:    'Quick read',
  decision_memo: 'Decision memo',
  deep_dive:     'Deep dive',
}

const confidenceStyle = (c: string) => ({
  background: `var(--color-status-${c === 'high' ? 'complete' : c === 'medium' ? 'progress' : 'blocked'}-bg)`,
  color:      `var(--color-status-${c === 'high' ? 'complete' : c === 'medium' ? 'progress' : 'blocked'})`,
  border:     'none',
})

interface RunCardProps {
  archive: DesignOpsArchive
  view: 'private' | 'shared'
  onDelete: (id: string) => void
}

export function RunCard({ archive, view, onDelete }: RunCardProps) {
  const [sheetOpen, setSheetOpen] = useState(false)

  const confidence = archive.messages
    .find(m => m.from === 'research_insights' && m.confidence !== 'n/a')
    ?.confidence ?? 'n/a'

  const modeLabel = MODE_LABELS[archive.mode] ?? archive.mode
  const formattedDate = new Date(archive.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
  })
  const objectiveTitle = archive.objectives?.[0]?.title ?? ''

  return (
    <>
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setSheetOpen(true)}
      >
        <CardContent className="py-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-snug flex-1">{archive.prompt}</p>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={e => { e.stopPropagation(); onDelete(archive.id) }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {confidence !== 'n/a' && (
              <Badge style={confidenceStyle(confidence)}>
                {confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence
              </Badge>
            )}
            <Badge variant="secondary">{modeLabel}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{formattedDate}{objectiveTitle ? ` · ${objectiveTitle}` : ''}</p>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{archive.prompt}</SheetTitle>
            <SheetDescription>{modeLabel} · {formattedDate}</SheetDescription>
          </SheetHeader>
          <Separator className="my-4" />
          {view === 'private'
            ? <DesignOpsTimeline messages={archive.messages} mode={archive.mode} showProcess={false} />
            : <DesignOpsFindingsSummary messages={archive.messages} />
          }
        </SheetContent>
      </Sheet>
    </>
  )
}
```

> **Note:** Check `DesignOpsTimeline` props with the grep from the start of this task. The prop `showProcess` may differ — match the actual API.

- [ ] **Step 4: Run tests — confirm all pass**

```bash
node --test test/carrier-results-components.test.mjs
```
Expected: all passing

- [ ] **Step 5: Commit**

```bash
git add components/design/run-card.tsx test/carrier-results-components.test.mjs
git commit -m "feat: add RunCard with Sheet detail view"
```

---

## Task 8: InsightCard + StepResults

**Files:**
- Create: `components/design/insight-card.tsx`
- Create: `components/design/step-results.tsx`
- Create: `test/carrier-step-results.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// test/carrier-step-results.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("insight-card renders type tag with CSS var colors", () => {
  const src = read("components/design/insight-card.tsx");
  assert.match(src, /var\(--color-insight-/);
  assert.match(src, /insight\.type/);
});

test("insight-card uses Collapsible and disables trigger in shared view", () => {
  const src = read("components/design/insight-card.tsx");
  assert.match(src, /Collapsible/);
  assert.match(src, /CollapsibleTrigger/);
  assert.match(src, /shared/);
});

test("insight-card shows detail in private view only", () => {
  const src = read("components/design/insight-card.tsx");
  assert.match(src, /insight\.detail/);
  assert.match(src, /private/);
  assert.match(src, /CollapsibleContent/);
});

test("step-results renders SummaryStrip, NewRunCard, RunCard, InsightCard", () => {
  const src = read("components/design/step-results.tsx");
  assert.match(src, /SummaryStrip/);
  assert.match(src, /NewRunCard/);
  assert.match(src, /RunCard/);
  assert.match(src, /InsightCard/);
});

test("step-results passes view and onDelete to RunCard", () => {
  const src = read("components/design/step-results.tsx");
  assert.match(src, /view={view}/);
  assert.match(src, /onDelete={onDeleteArchive}/);
});

test("step-results derives SummaryData from archives", () => {
  const src = read("components/design/step-results.tsx");
  assert.match(src, /research_insights/);
  assert.match(src, /SummaryData/);
  assert.match(src, /latestSynthesis/);
});

test("step-results derives insights from Top findings sections", () => {
  const src = read("components/design/step-results.tsx");
  assert.match(src, /deriveInsights/);
  assert.match(src, /Top findings/);
  assert.match(src, /formatPlainTextSections/);
});

test("step-results shared view shows only SummaryStrip and insights", () => {
  const src = read("components/design/step-results.tsx");
  assert.match(src, /view.*shared/);
  assert.doesNotMatch(src, /shared.*RunCard/);
});

test("step-results renders NewRunCard only in private view", () => {
  const src = read("components/design/step-results.tsx");
  // NewRunCard is under private render path
  assert.match(src, /private/);
  assert.match(src, /NewRunCard/);
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
node --test test/carrier-step-results.test.mjs
```
Expected: 9 failures

- [ ] **Step 3: Create `components/design/insight-card.tsx`**

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { type Insight } from '@/lib/carrier-types'

interface InsightCardProps {
  insight: Insight
  view: 'private' | 'shared'
}

export function InsightCard({ insight, view }: InsightCardProps) {
  return (
    <Collapsible>
      <Card>
        <CollapsibleTrigger asChild disabled={view === 'shared'}>
          <CardContent className="flex items-start gap-3 py-4 cursor-pointer">
            <span
              className="shrink-0 rounded px-2 py-0.5 text-xs font-medium mt-0.5"
              style={{
                background: `var(--color-insight-${insight.type}-bg)`,
                color:      `var(--color-insight-${insight.type}-text)`,
              }}
            >
              {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{insight.text}</p>
              <p className="text-xs text-muted-foreground mt-1">{insight.source}</p>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        {view === 'private' && insight.detail && (
          <CollapsibleContent>
            <Separator />
            <CardContent className="py-3 text-sm text-muted-foreground">
              {insight.detail}
            </CardContent>
          </CollapsibleContent>
        )}
      </Card>
    </Collapsible>
  )
}
```

- [ ] **Step 4: Create `components/design/step-results.tsx`**

```tsx
import { useMemo } from 'react'
import { SummaryStrip } from './summary-strip'
import { NewRunCard } from './new-run-card'
import { RunCard } from './run-card'
import { InsightCard } from './insight-card'
import { formatPlainTextSections } from '@/lib/design-ops-formatting'
import { extractSection } from '@/lib/design-ops-formatting'
import { type DesignOpsArchive, type AgentMessage } from '@/lib/design-ops-types'
import { type SummaryData, type Insight, type InsightType } from '@/lib/carrier-types'

function deriveInsights(archives: DesignOpsArchive[]): Insight[] {
  return archives.flatMap(archive => {
    const msg = archive.messages.find(
      m => m.from === 'research_insights' && m.confidence !== 'n/a'
    )
    if (!msg) return []
    const sections = formatPlainTextSections(msg.body)
    const findings = sections.find(s => s.label === 'Top findings' || s.label === 'Findings')
    return (findings?.content ?? []).slice(0, 3).map((line, i) => ({
      id:     `${archive.id}-finding-${i}`,
      type:   'pattern' as InsightType,
      text:   line,
      source: new Date(archive.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))
  })
}

interface StepResultsProps {
  archives: DesignOpsArchive[]
  messages: AgentMessage[]
  running: boolean
  view: 'private' | 'shared'
  onDeleteArchive: (id: string) => void
  onNavigateToAnalysis: () => void
}

export function StepResults({
  archives, messages, running, view, onDeleteArchive, onNavigateToAnalysis,
}: StepResultsProps) {
  const latestSynthesis = useMemo(() =>
    [...archives]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      ?.messages.find(m => m.from === 'research_insights' && m.confidence !== 'n/a'),
    [archives]
  )

  const derivedInsights = useMemo(() => deriveInsights(archives), [archives])

  const summary: SummaryData = {
    confidence:     (latestSynthesis?.confidence as SummaryData['confidence']) ?? null,
    participants:   null,
    insights:       derivedInsights.length,
    recommendation: extractSection(latestSynthesis?.body ?? '', 'RECOMMENDATION').slice(0, 80),
    nextSteps:      latestSynthesis?.nextStep ?? '',
  }

  const sortedArchives = useMemo(
    () => [...archives].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [archives]
  )

  if (view === 'private') {
    return (
      <div className="space-y-6">
        <SummaryStrip summary={summary} />

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Analysis runs
          </p>
          <div className="space-y-2">
            <NewRunCard onNewRun={onNavigateToAnalysis} />
            {sortedArchives.map(a => (
              <RunCard
                key={a.id}
                archive={a}
                view={view}
                onDelete={onDeleteArchive}
              />
            ))}
          </div>
        </div>

        {derivedInsights.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Insights
            </p>
            <div className="space-y-2">
              {derivedInsights.map(i => (
                <InsightCard key={i.id} insight={i} view="private" />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SummaryStrip summary={summary} />

      {derivedInsights.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Insights
          </p>
          <div className="space-y-2">
            {derivedInsights.slice(0, 5).map(i => (
              <InsightCard key={i.id} insight={i} view="shared" />
            ))}
          </div>
        </div>
      )}

      {summary.nextSteps && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Next steps
          </p>
          <p className="text-sm text-muted-foreground">{summary.nextSteps}</p>
        </div>
      )}
    </div>
  )
}
```

> **Note:** If `extractSection` is not exported from `design-ops-formatting.ts`, check the actual export name:
> ```bash
> grep "export function\|export const" /Users/miguelarias/cafemedia/design/carrier/lib/design-ops-formatting.ts
> ```
> Adjust the import path and function call to match.

- [ ] **Step 5: Run tests — confirm they pass**

```bash
node --test test/carrier-step-results.test.mjs
```
Expected: 9 passing

- [ ] **Step 6: Commit**

```bash
git add components/design/insight-card.tsx components/design/step-results.tsx test/carrier-step-results.test.mjs
git commit -m "feat: add InsightCard and StepResults"
```

---

## Task 9: DesignOpsModule + StepDesignOps

**Files:**
- Create: `components/design/design-ops-module.tsx`
- Create: `components/design/step-design-ops.tsx`
- Create: `test/carrier-design-ops-step.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// test/carrier-design-ops-step.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

test("design-ops-module renders status dot with CSS var color", () => {
  const src = read("components/design/design-ops-module.tsx");
  assert.match(src, /var\(--color-status-/);
  assert.match(src, /size-\[7px\]/);
  assert.match(src, /rounded-full/);
});

test("design-ops-module shows correct subtitle per status", () => {
  const src = read("components/design/design-ops-module.tsx");
  assert.match(src, /complete/);
  assert.match(src, /blocked/);
  assert.match(src, /in_progress/);
  assert.match(src, /Not started/);
});

test("design-ops-module uses Collapsible for expand/collapse", () => {
  const src = read("components/design/design-ops-module.tsx");
  assert.match(src, /Collapsible/);
  assert.match(src, /CollapsibleTrigger/);
  assert.match(src, /CollapsibleContent/);
});

test("design-ops-module renders ChevronRight", () => {
  const src = read("components/design/design-ops-module.tsx");
  assert.match(src, /ChevronRight/);
});

test("design-ops-module blocked text uses CSS var color", () => {
  const src = read("components/design/design-ops-module.tsx");
  assert.match(src, /var\(--color-status-blocked\)/);
  assert.match(src, /blockedReason/);
});

test("step-design-ops renders MOCK_MODULES using DesignOpsModule", () => {
  const src = read("components/design/step-design-ops.tsx");
  assert.match(src, /MOCK_MODULES/);
  assert.match(src, /DesignOpsModule/);
});

test("step-design-ops mock data covers all four status states", () => {
  const src = read("components/design/step-design-ops.tsx");
  assert.match(src, /in_progress/);
  assert.match(src, /complete/);
  assert.match(src, /blocked/);
  assert.match(src, /not_started/);
});

test("step-design-ops wraps modules in a Card with divide-y", () => {
  const src = read("components/design/step-design-ops.tsx");
  assert.match(src, /Card/);
  assert.match(src, /divide-y/);
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
node --test test/carrier-design-ops-step.test.mjs
```
Expected: 8 failures

- [ ] **Step 3: Create `components/design/design-ops-module.tsx`**

```tsx
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { type StatusId } from '@/lib/carrier-types'

const dotToken: Record<StatusId, string> = {
  complete:    'complete',
  in_progress: 'progress',
  blocked:     'blocked',
  not_started: 'idle',
}

interface DesignOpsModuleData {
  id: string
  name: string
  status: StatusId
  nextAction?: string
  completedAt?: string
  blockedReason?: string
}

interface DesignOpsModuleProps {
  module: DesignOpsModuleData
}

export function DesignOpsModule({ module }: DesignOpsModuleProps) {
  const subtitleText =
    module.status === 'complete'    ? `Completed ${module.completedAt ?? ''}`
    : module.status === 'in_progress' ? (module.nextAction ?? 'In progress')
    : module.status === 'blocked'     ? (module.blockedReason ?? 'Blocked')
    : 'Not started'

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-3 px-4 py-4 hover:bg-muted/50 cursor-pointer transition-colors">
          <div
            className="size-[7px] rounded-full shrink-0"
            style={{ background: `var(--color-status-${dotToken[module.status]})` }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{module.name}</p>
            <p
              className={cn(
                'text-xs mt-0.5',
                module.status === 'blocked'
                  ? ''
                  : 'text-muted-foreground'
              )}
              style={module.status === 'blocked' ? { color: 'var(--color-status-blocked)' } : undefined}
            >
              {subtitleText}
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Separator />
        <div className="px-4 py-4 text-sm text-muted-foreground">
          <p>Module detail coming soon.</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

- [ ] **Step 4: Create `components/design/step-design-ops.tsx`**

```tsx
import { Card } from '@/components/ui/card'
import { DesignOpsModule } from './design-ops-module'
import { type StatusId } from '@/lib/carrier-types'

const MOCK_MODULES: Array<{
  id: string; name: string; status: StatusId
  nextAction?: string; completedAt?: string; blockedReason?: string
}> = [
  { id: '1', name: 'Handoff spec',          status: 'in_progress', nextAction: 'Review with engineering — due Mar 20' },
  { id: '2', name: 'Research synthesis',    status: 'complete',    completedAt: 'Mar 14' },
  { id: '3', name: 'Prototype review',      status: 'blocked',     blockedReason: 'Waiting on design system token update' },
  { id: '4', name: 'Stakeholder review',    status: 'not_started' },
]

export function StepDesignOps() {
  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Design Ops
      </p>
      <Card className="divide-y overflow-hidden">
        {MOCK_MODULES.map(mod => (
          <DesignOpsModule key={mod.id} module={mod} />
        ))}
      </Card>
    </div>
  )
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
node --test test/carrier-design-ops-step.test.mjs
```
Expected: 8 passing

- [ ] **Step 6: Commit**

```bash
git add components/design/design-ops-module.tsx components/design/step-design-ops.tsx test/carrier-design-ops-step.test.mjs
git commit -m "feat: add DesignOpsModule and StepDesignOps"
```

---

## Task 10: Delete old files + smoke test

**Files:**
- Delete: `components/design/design-ops-client.tsx`
- Delete: `components/design/design-ops-archive-list.tsx`
- Delete: `components/design/design-ops-active-objective-summary.tsx`
- Create: `test/carrier-workspace-structure.test.mjs`

- [ ] **Step 1: Write the smoke test**

```js
// test/carrier-workspace-structure.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = "/Users/miguelarias/cafemedia/design/carrier";
function exists(p) { return fs.existsSync(path.join(root, p)); }
function read(p) { return fs.readFileSync(path.join(root, p), "utf8"); }

// Deleted files must not exist
test("design-ops-client.tsx has been deleted", () => {
  assert.equal(exists("components/design/design-ops-client.tsx"), false);
});
test("design-ops-archive-list.tsx has been deleted", () => {
  assert.equal(exists("components/design/design-ops-archive-list.tsx"), false);
});
test("design-ops-active-objective-summary.tsx has been deleted", () => {
  assert.equal(exists("components/design/design-ops-active-objective-summary.tsx"), false);
});

// All new carrier files exist
const REQUIRED = [
  "lib/carrier-types.ts",
  "components/design/carrier-shell.tsx",
  "components/design/carrier-rail.tsx",
  "components/design/spine-nav.tsx",
  "components/design/session-history.tsx",
  "components/design/carrier-topbar.tsx",
  "components/design/carrier-main-pane.tsx",
  "components/design/step-objective.tsx",
  "components/design/step-analysis.tsx",
  "components/design/step-results.tsx",
  "components/design/step-design-ops.tsx",
  "components/design/summary-strip.tsx",
  "components/design/new-run-card.tsx",
  "components/design/run-card.tsx",
  "components/design/insight-card.tsx",
  "components/design/design-ops-module.tsx",
];
for (const f of REQUIRED) {
  test(`${f} exists`, () => assert.equal(exists(f), true));
}

// .do-* classes must still exist in globals.css (used by kept components)
test("globals.css still contains .do-* classes needed by kept components", () => {
  const css = read("app/globals.css");
  assert.match(css, /\.do-/);
  assert.match(css, /\.do-table/);
  assert.match(css, /\.do-badge/);
});

// page.tsx does not import DesignOpsClient
test("page.tsx does not import DesignOpsClient", () => {
  const src = read("app/design-ops/page.tsx");
  assert.doesNotMatch(src, /DesignOpsClient/);
});

// No new component file contains a hardcoded hex value
const CARRIER_COMPONENTS = REQUIRED.filter(f => f.startsWith("components/design/"));
for (const f of CARRIER_COMPONENTS) {
  test(`${f} has no hardcoded hex color`, () => {
    const src = read(f);
    // Allow hex in comments but not in JSX style or className
    assert.doesNotMatch(src, /style=\{.*#[0-9a-fA-F]{3,6}/);
    assert.doesNotMatch(src, /className=".*#[0-9a-fA-F]/);
  });
}
```

- [ ] **Step 2: Run tests — confirm deletions fail (files still exist)**

```bash
node --test test/carrier-workspace-structure.test.mjs
```
Expected: 3 deletion tests fail, all existence tests pass, no hex tests fail

- [ ] **Step 3: Delete the old files**

```bash
rm /Users/miguelarias/cafemedia/design/carrier/components/design/design-ops-client.tsx
rm /Users/miguelarias/cafemedia/design/carrier/components/design/design-ops-archive-list.tsx
rm /Users/miguelarias/cafemedia/design/carrier/components/design/design-ops-active-objective-summary.tsx
```

- [ ] **Step 4: Run all tests — confirm everything passes**

```bash
node --test test/carrier-workspace-structure.test.mjs
node --test test/carrier-workspace-foundation.test.mjs
node --test test/carrier-shell.test.mjs
node --test test/carrier-rail.test.mjs
node --test test/carrier-topbar.test.mjs
node --test test/carrier-main-pane.test.mjs
node --test test/carrier-results-components.test.mjs
node --test test/carrier-step-results.test.mjs
node --test test/carrier-design-ops-step.test.mjs
```
Expected: all passing

- [ ] **Step 5: TypeScript build check**

```bash
cd /Users/miguelarias/cafemedia/design/carrier && npx tsc --noEmit 2>&1 | head -40
```
Fix any type errors before committing. Common issues:
- Props type mismatches on `StepAnalysis` / `DesignOpsCrewRunner` (verify prop names match the actual component)
- `extractSection` import path if it is not exported from `design-ops-formatting.ts`

- [ ] **Step 6: Commit**

```bash
git add test/carrier-workspace-structure.test.mjs
git rm components/design/design-ops-client.tsx components/design/design-ops-archive-list.tsx components/design/design-ops-active-objective-summary.tsx
git commit -m "feat: remove legacy design-ops UI files"
```

---

## Task 11: Visual verification

This is a manual check. No code changes unless something is broken.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```
Open `http://localhost:3500/design-ops`

- [ ] **Step 2: Check against acceptance criteria**

Work through each item in the spec's acceptance criteria list. For each one, note pass/fail:

- [ ] Two-pane layout renders, rail fixed at 220px
- [ ] Rail is always visible
- [ ] Spine nav shows correct dot colors for all four states
- [ ] Any step is directly clickable
- [ ] Active step has left 2.5px border accent
- [ ] Workspace opens to first incomplete step on mount
- [ ] "New session" button visible
- [ ] History section shows past sessions
- [ ] Private/Shared toggle switches the render
- [ ] `?view=shared` in URL shows shared view
- [ ] Copy share link copies URL with `?view=shared`
- [ ] Summary strip visible in both views
- [ ] "New run" card always first, has dashed border
- [ ] Clicking "New run" navigates to Analysis step
- [ ] Run cards show question + badges + date
- [ ] Clicking run card opens Sheet
- [ ] Sheet shows timeline (private) or summary (shared)
- [ ] Design Ops step shows modules with correct status dots
- [ ] Blocked module shows reason text

- [ ] **Step 3: Fix any visual issues found**

Fix inline. If changes are significant, commit them separately.

- [ ] **Step 4: Final commit**

```bash
git fetch origin && git status
git log HEAD..origin/main --oneline
# If not empty, rebase first: git rebase origin/main
git push origin main
```

> **Wait** — do not push until the user explicitly approves.
