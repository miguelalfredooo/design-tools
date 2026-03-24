# Carrier Workspace Redesign — Design Spec

**Date:** 2026-03-17
**Status:** Approved for implementation
**Scope:** Full UI rebuild — layout shell, rail, spine nav, main pane, Results step, Design Ops step

---

## What this is

A full rebuild of the Carrier UI layer. The data layer (API routes, hooks, types, utilities) is
unchanged. Every UI component is replaced with a new architecture based on the approved wireframe
and the following constraints:

- shadcn/ui components throughout — Card, Badge, Button, Separator, ScrollArea, etc.
- CSS custom properties only — no hardcoded hex values in component files
- Comfortable spacing — shadcn default padding and gaps, no artificial compression
- Modular components — each area of the workspace is a self-contained component

---

## Scope boundary

**In scope for this build:**
- Layout shell (two-pane, rail, topbar)
- Spine nav with live status
- New session / session history in rail
- Results step — SummaryStrip + RunCards + InsightCards (stubbed, see below)
- Design Ops step — accordion module list
- Objective step — objective form (reuse existing components)
- Analysis step — run configuration (reuse existing components)
- Shared / Private view toggle via URL param
- RunCard Sheet detail view

**Out of scope / future:**
- Insight data model with its own storage and API — insights in this build are derived
  from synthesis messages (see InsightCard section). Full insight CRUD is a later phase.
- Copy share link — renders the button; on click it copies `window.location.href`. No token
  or auth system in this build.
- Multi-session management — session CRUD beyond what the current hook provides.

---

## Route entry point

`app/design-ops/page.tsx` — unchanged shape. Wraps `<CarrierShell>` in a `<Suspense>` boundary.

```tsx
// app/design-ops/page.tsx
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

---

## Existing types (kept unchanged in `lib/design-ops-types.ts`)

The following types are already defined and should be imported from `@/lib/design-ops-types`:

- `Objective` — `{ id, title, metric, target, description, segmentIds, lifecycleCohorts, theoryOfSuccess?, createdAt }`
- `AgentMessage` — `{ from, fromName, to, subject, priority, confidence, assumptions, body, nextStep, timestamp }`
- `DesignOpsArchive` — `{ id, prompt, mode, objectives: Objective[], messages: AgentMessage[], provider?, model?, createdAt }`
- `SynthesisMode` — `'quick_read' | 'decision_memo' | 'deep_dive'`
- `CrewHealthStatus`

`useDesignOpsWorkspace()` hook returns (from `hooks/use-design-ops-workspace.ts`, kept unchanged):

```ts
{
  objectives:          Objective[]
  activeObjectiveId:   string | null
  activeObjective:     Objective | null   // memoized from objectives + activeObjectiveId
  messages:            AgentMessage[]
  archives:            DesignOpsArchive[]
  running:             boolean
  loading:             boolean
  currentRunMode:      SynthesisMode
  setActiveObjectiveId:(id: string | null) => void
  setMessages:         (msgs: AgentMessage[]) => void
  setRunning:          (r: boolean) => void
  setCurrentRunMode:   (m: SynthesisMode) => void
  addObjective:        (obj: Omit<Objective, 'id'|'createdAt'>) => Promise<Objective | null>
  updateObjective:     (id: string, updates: Omit<Objective, 'id'|'createdAt'>) => Promise<Objective | null>
  deleteObjective:     (id: string) => void
  deleteArchive:       (id: string) => void
  archiveRun:          (payload: { prompt, mode, objectives, messages, provider?, model? }) => Promise<void>
}
```

---

## Types (`lib/carrier-types.ts`)

```ts
export type StepId = 'objective' | 'analysis' | 'results' | 'design-ops'

export type StatusId = 'not_started' | 'in_progress' | 'complete' | 'blocked'

export const STATUS_LABELS: Record<StatusId, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete:    'Complete',
  blocked:     'Blocked',
}

export type SpineStep = {
  id:          StepId
  label:       string
  status:      StatusId
  blockedReason?: string   // plain-language, shown in rail when blocked
}

export type InsightType = 'risk' | 'opportunity' | 'pattern'

export type Insight = {
  id:        string
  type:      InsightType
  text:      string
  source:    string    // e.g. "Session 4 · Mar 14"
  detail?:   string    // supporting detail — private view only
}

export type SummaryData = {
  confidence:     'high' | 'medium' | 'low' | null
  participants:   number | null
  insights:       number
  recommendation: string     // short text, 3–6 words when possible
  nextSteps:      string     // one-line action — shown in shared view
}
```

---

## Color tokens (`globals.css` additions to `:root`)

All semantic colors defined here. Never referenced by hex in component files —
always `var(--color-*)`.

```css
/* Status indicators */
--color-status-complete:         #3B6D11;
--color-status-complete-bg:      #EAF3DE;
--color-status-progress:         #854F0B;
--color-status-progress-bg:      #FAEEDA;
--color-status-blocked:          #A32D2D;
--color-status-blocked-bg:       #FCEBEB;
--color-status-idle:             #888780;
--color-status-idle-bg:          #F1EFE8;

/* Insight card types */
--color-insight-risk-bg:              #FCEBEB;
--color-insight-risk-text:            #A32D2D;
--color-insight-opportunity-bg:       #EAF3DE;
--color-insight-opportunity-text:     #3B6D11;
--color-insight-pattern-bg:           #E1F5EE;
--color-insight-pattern-text:         #0F6E56;
```

---

## Data flow

`CarrierShell` calls `useDesignOpsWorkspace()` once. All derived state flows down as props.

```
useDesignOpsWorkspace()
  → objectives, activeObjective, messages, archives, running, loading
  → addObjective, updateObjective, deleteObjective, archiveRun, deleteArchive, ...

CarrierShell (owns all state)
  ├── CarrierRail
  │     props: activeStep, steps, onStepChange, onNewSession, activeObjective,
  │            sessions (derived from archives in CarrierShell)
  ├── CarrierTopbar
  │     props: view, onViewChange
  └── CarrierMainPane
        props: activeStep, view, onViewChange, onNavigateToAnalysis, onRunComplete,
               + all workspace state/actions
          ├── StepObjective      (activeStep === 'objective')
          ├── StepAnalysis       (activeStep === 'analysis')
          ├── StepResults        (activeStep === 'results')
          └── StepDesignOps      (activeStep === 'design-ops')
```

**Shared view state:** managed via URL param `?view=shared`. `CarrierShell` reads
`useSearchParams()` and derives `view: 'private' | 'shared'` — passes it down as a prop.
`CarrierShell` also defines `onViewChange` which calls `router.replace` (from `useRouter`) to
update the URL param:

```ts
const onViewChange = (v: 'private' | 'shared') => {
  const params = new URLSearchParams(searchParams.toString())
  if (v === 'shared') { params.set('view', 'shared') } else { params.delete('view') }
  router.replace(`?${params.toString()}`)
}
```

`CarrierTopbar` calls `onViewChange('private')` / `onViewChange('shared')` in its button
`onClick` handlers — it does not write to the URL directly. The shared link is simply the
current URL with `?view=shared` appended — no token needed in this build.

---

## Components

### `CarrierShell`

**Must have `'use client'` directive** — uses `useSearchParams()`, `useState`, and
`useDesignOpsWorkspace()`. `page.tsx` imports it as a Client Component inside a Suspense boundary
(required by Next.js when `useSearchParams` is present).

Root layout. Calls `useDesignOpsWorkspace()`. Reads `activeStep` from local state
(defaults to the first incomplete step). Reads `view` from URL param.

```tsx
className="flex h-screen overflow-hidden"
```

Derives `steps: SpineStep[]` from workspace state:
- objective: `complete` if `activeObjective !== null`, else `not_started`
- analysis: `in_progress` if `running`, `complete` if `archives.length > 0`, else `not_started`
- results: `in_progress` if `archives.length > 0 || messages.length > 0`, else `not_started`
- design-ops: always `not_started` in this build (module persistence is future scope)

**Initial step on mount** — scans only `objective → analysis → results` in order:
- If objective is `not_started` → land on `objective`
- Else if analysis is `not_started` → land on `analysis`
- Else → land on `results`
- `design-ops` is never the automatic landing step; it is only reached by clicking it in the rail.

**`onNewSession`** — called by the "New session" button in the rail. Resets workspace to initial
state: calls `setActiveObjectiveId(null)`, `setMessages([])`, sets `activeStep` to `'objective'`.
Does not create or delete any persisted data — the user then creates a new objective in StepObjective.

**`onNavigateToAnalysis`** — defined in `CarrierShell` as `() => setActiveStep('analysis')`.
Passed to `CarrierMainPane` → `StepResults` → `NewRunCard` as `onNewRun`.

**`onRunComplete`** — defined in `CarrierShell`. Calls `archiveRun(payload)`, then shows a
post-run toast with a "View results" action button (see StepAnalysis section). Passed to
`CarrierMainPane` → `StepAnalysis` as `onRunComplete`.

**`sessions` derivation** — `CarrierShell` derives `sessions` for `CarrierRail`:
```ts
const sessions = archives
  .filter(a => a.objectives?.length > 0)
  .reduce<Map<string, { id: string; title: string; status: StatusId }>>((map, a) => {
    const objId = a.objectives[0].id
    if (!map.has(objId)) {
      map.set(objId, { id: objId, title: a.objectives[0].title ?? 'Untitled session', status: 'complete' })
    }
    return map
  }, new Map())
const sessionList = Array.from(sessions.values())
```

---

### `CarrierRail`

Props: `activeStep: StepId`, `steps: SpineStep[]`, `onStepChange: (id: StepId) => void`,
`onNewSession: () => void`, `activeObjective: Objective | null`,
`sessions: Array<{ id: string; title: string; status: StatusId }>`

```tsx
className="w-[220px] shrink-0 flex flex-col border-r h-full"
```

Sections (top to bottom):

**1. Session context** (padding `p-4`, bottom border)
- Label: `text-xs text-muted-foreground font-medium uppercase tracking-wide`
- Session name: `text-sm font-medium` (uses `activeObjective.title` or "No active session")

**2. New session button** (padding `px-4 py-3`, bottom border)
- `<Button variant="outline" size="sm" className="w-full justify-start gap-2">`
- `<Plus className="size-4" />` New session

**3. Spine nav** (`<SpineNav>`, flex-1, overflow-y-auto)

**4. History** (`<SessionHistory>`, `mt-auto`, top border, padding `p-4`)

---

### `SpineNav`

Props: `steps: SpineStep[]`, `activeStepId: StepId`, `onStepChange: (id: StepId) => void`

Each `SpineNavItem`:

```tsx
// Row container — active step gets left border
className={cn(
  "flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors",
  "hover:bg-muted/50",
  isActive && "border-l-[2.5px] border-foreground bg-background pl-[14px]"
)}
```

Inside the row:
- **Connector column** — flex-col, centered: dot (7px `rounded-full`) + connector line
  (`w-px flex-1 bg-border`, hidden on last item)
- **Content column**:
  - Step label: `text-sm font-medium` (muted if idle, foreground if active/complete)
  - Status badge: `<Badge variant="outline">` with inline style using CSS vars for color
    — shown only for `in_progress` and `blocked`
  - Blocked reason: `text-xs` in `--color-status-blocked`, shown when `status === 'blocked'`

Dot color per status:
```tsx
const dotBg: Record<StatusId, string> = {
  complete:    'var(--color-status-complete)',
  in_progress: 'var(--color-status-progress)',
  blocked:     'var(--color-status-blocked)',
  not_started: 'var(--color-border)',
}
```

---

### `SessionHistory`

Props: `sessions: Array<{ id: string; title: string; status: StatusId }>`,
`onSelect: (id: string) => void`

Each row:
```tsx
className="flex items-center gap-2 py-1.5 cursor-pointer hover:text-foreground transition-colors"
```
- 6px dot with status color
- `text-sm text-muted-foreground`

In this build, `sessions` is derived from `archives` grouped by `objectives[0]?.id`. Each archive
carries a snapshot of the objectives used in that run. Group by the first objective's id (not title)
to avoid collisions. Display name is `objectives[0]?.title ?? 'Untitled session'`. Archives where
`objectives` is empty or undefined are skipped. Implementation handled in `CarrierShell`.

All sessions in `SessionHistory` are past completed archives — their `status` is always `'complete'`.

---

### `CarrierTopbar`

Props: `view: 'private' | 'shared'`, `onViewChange: (v: 'private' | 'shared') => void`

```tsx
className="flex items-center justify-between border-b px-5 py-3 shrink-0"
```

View toggle:
```tsx
// Wrapper
<div className="flex bg-muted rounded-md p-0.5 gap-0.5">
  <Button
    variant={view === 'private' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => onViewChange('private')}
  >Private</Button>
  <Button
    variant={view === 'shared' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => onViewChange('shared')}
  >Shared</Button>
</div>
```

Copy link:
```tsx
<Button variant="outline" size="sm" onClick={() => {
  const url = new URL(window.location.href)
  url.searchParams.set('view', 'shared')
  navigator.clipboard.writeText(url.toString())
  toast.success('Link copied')
}}>
  Copy share link
</Button>
```

---

### `CarrierMainPane`

Props: `activeStep: StepId`, `view: 'private' | 'shared'`,
`onViewChange: (v: 'private' | 'shared') => void`,
`onNavigateToAnalysis: () => void`,
`onRunComplete: () => void`,
+ all workspace state/actions from `useDesignOpsWorkspace()`

```tsx
className="flex-1 flex flex-col min-w-0 overflow-hidden"
```

Renders topbar + step content:
```tsx
<CarrierTopbar view={view} onViewChange={onViewChange} />
<ScrollArea className="flex-1">
  <div className="p-5">
    {activeStep === 'objective'   && <StepObjective ... />}
    {activeStep === 'analysis'    && <StepAnalysis  ... />}
    {activeStep === 'results'     && <StepResults   ... />}
    {activeStep === 'design-ops'  && <StepDesignOps ... />}
  </div>
</ScrollArea>
```

---

### `StepObjective`

Reuses existing `DesignOpsObjectives` component verbatim.
Props passed through: `objectives`, `activeObjectiveId`, `onActiveObjectiveChange`,
`onAdd`, `onUpdate`, `onDelete`.

No new implementation — this step is a wrapper.

---

### `StepAnalysis`

Reuses existing `DesignOpsCrewRunner` component verbatim.
Props passed through: `objective`, `onMessages`, `onRunStatusChange`, `onModeChange`, `onRunComplete`.

**Post-run prompt (PRD §8.1 — do not auto-advance):**
`onRunComplete` in `CarrierShell` calls `archiveRun(payload)` then shows a toast with an action
button — not an automatic navigation:

```ts
toast.success('Analysis complete', {
  action: {
    label: 'View results',
    onClick: () => setActiveStep('results'),
  },
})
```

The user must click "View results" to navigate. The step does not change automatically.

---

### `StepResults`

Props: `archives: DesignOpsArchive[]`, `messages: AgentMessage[]`, `running: boolean`,
`view: 'private' | 'shared'`, `onDeleteArchive: (id: string) => void`,
`onNavigateToAnalysis: () => void`

**Private view renders:**
1. `<SummaryStrip summary={derivedSummary} />`
2. Section label "Analysis runs"
3. `<NewRunCard onNewRun={onNavigateToAnalysis} />` — always first
4. `archives.map(a => <RunCard archive={a} view={view} onDelete={onDeleteArchive} />)` — newest first
5. Section label "Insights"
6. `derivedInsights.map(i => <InsightCard insight={i} view="private" />)`

**Shared view renders:**
1. `<SummaryStrip summary={derivedSummary} />`
2. Section label "Insights"
3. `derivedInsights.slice(0, 5).map(i => <InsightCard insight={i} view="shared" />)`
4. Next steps text block (from `derivedSummary.nextSteps`)

**Note on section parsing:**
- `extractSection(body, key)` is **case-insensitive** (uses `"i"` regex flag). Pass keys in any
  case — `'RECOMMENDATION'` and `'recommendation'` both work.
- `formatPlainTextSections(body)` uses a regex that matches **ALL-CAPS headers only**
  (pattern: `[A-Z][A-Z\s]+:`). Agent messages emit headers like `"TOP FINDINGS:"` in all-caps,
  which is why the function's normalized output labels (`"Top findings"`, `"Findings"`, etc.) are
  reliable. Do not attempt to parse mixed-case headers with this function.
  Correct normalized labels to match against: `"Top findings"`, `"Findings"`, `"Recommendations"`,
  `"Summary"`, `"Details"`, `"Confidence"`, `"Readiness"`, `"Assumptions"`, `"Next steps"`.

**Deriving `SummaryData` from archives + messages:**
```ts
// Pull from the most recent research_insights message with confidence !== 'n/a'
const latestSynthesis = [...archives]
  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  ?.messages.find(m => m.from === 'research_insights' && m.confidence !== 'n/a')

const summary: SummaryData = {
  confidence:     latestSynthesis?.confidence ?? null,
  participants:   null,   // not in current data model — renders '—'
  insights:       derivedInsights.length,
  recommendation: extractSection(latestSynthesis?.body ?? '', 'RECOMMENDATION').slice(0, 60),
  nextSteps:      latestSynthesis?.nextStep ?? '',
}
```

**Deriving `Insight[]` from archives:**
Insights are synthesised from the `Top findings` sections of archived research_insights messages.
Each bullet point becomes an Insight with type defaulting to `'pattern'`. This is a temporary
derivation until a full Insight data model is built.

```ts
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
      source: `${new Date(archive.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    }))
  })
}
```

---

### `SummaryStrip`

Props: `summary: SummaryData`

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
```

Each tile:
```tsx
<Card className="p-4">
  <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
  <p className="text-base font-medium">{value}</p>
</Card>
```

Confidence tile value color: applied via inline `style={{ color: 'var(--color-status-*)' }}` keyed on confidence level — this is the one permitted inline style since it's a dynamic token lookup, not a hardcoded hex.

Recommendation tile: `col-span-2` on larger breakpoints.
Null/empty values render as `—`.

---

### `NewRunCard`

Props: `onNewRun: () => void`

```tsx
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
```

`onNewRun` sets `activeStep` to `'analysis'` in `CarrierShell`. This navigates to the
Analysis step rather than opening a sheet — keeps the run configuration in its dedicated step.

---

### `RunCard`

Props: `archive: DesignOpsArchive`, `view: 'private' | 'shared'`, `onDelete: (id: string) => void`

```tsx
<Card
  className="cursor-pointer hover:bg-muted/50 transition-colors"
  onClick={() => setSheetOpen(true)}
>
  <CardContent className="py-4 space-y-2">
    {/* Question */}
    <p className="text-sm font-medium leading-snug">{archive.prompt}</p>

    {/* Badges row */}
    <div className="flex items-center gap-2">
      <Badge style={{ background: 'var(--color-status-*-bg)', color: 'var(--color-status-*)', border: 'none' }}>
        {confidence}
      </Badge>
      <Badge variant="secondary">{modeLabel}</Badge>
    </div>

    {/* Recommendation snippet */}
    <p className="text-sm text-muted-foreground line-clamp-2">{recommendationSnippet}</p>

    {/* Metadata */}
    <p className="text-xs text-muted-foreground">
      {formattedDate} · {objectiveTitle}
    </p>
  </CardContent>
</Card>
```

**RunCard Sheet:**

```tsx
<Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
  <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
    <SheetHeader>
      <SheetTitle>{archive.prompt}</SheetTitle>
      <SheetDescription>{modeLabel} · {formattedDate}</SheetDescription>
    </SheetHeader>
    <div className="mt-6">
      {view === 'private'
        ? <DesignOpsTimeline messages={archive.messages} mode={archive.mode} showProcess={false} />
        : <DesignOpsFindingsSummary messages={archive.messages} />
      }
    </div>
  </SheetContent>
</Sheet>
```

Confidence badge color is derived dynamically:
```ts
const confidenceBadgeStyle = (c: string) => ({
  background: `var(--color-status-${c === 'high' ? 'complete' : c === 'medium' ? 'progress' : 'blocked'}-bg)`,
  color:      `var(--color-status-${c === 'high' ? 'complete' : c === 'medium' ? 'progress' : 'blocked'})`,
  border:     'none',
})
```

---

### `InsightCard`

Props: `insight: Insight`, `view: 'private' | 'shared'`

Uses `<Collapsible>` for expand/collapse (private only).

```tsx
<Card>
  <CollapsibleTrigger asChild disabled={view === 'shared'}>
    <CardContent className="flex items-start gap-3 py-4 cursor-pointer">
      {/* Type tag */}
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
```

Note: inline style is used on the type tag because it's a dynamic lookup against CSS custom properties — a token reference, not a hardcoded color.

---

### `StepDesignOps`

Props: none in this build — Design Ops modules are static mock data until the module
persistence API is built. Renders a placeholder list using the four status states.

```tsx
// Temporary mock until module CRUD is implemented
const MOCK_MODULES = [
  { id: '1', name: 'Handoff spec', status: 'in_progress', nextAction: 'Review with engineering — due Mar 20' },
  { id: '2', name: 'Research synthesis', status: 'complete', completedAt: 'Mar 14' },
  { id: '3', name: 'Prototype review', status: 'blocked', blockedReason: 'Waiting on design system token update' },
  { id: '4', name: 'Stakeholder review', status: 'not_started' },
]
```

Wrapped in a single `<Card>` with `divide-y`:
```tsx
<Card>
  {modules.map((mod, i) => (
    <DesignOpsModule key={mod.id} module={mod} isLast={i === modules.length - 1} />
  ))}
</Card>
```

---

### `DesignOpsModule`

Props: `module: { id, name, status, nextAction?, completedAt?, blockedReason? }`

Uses `<Collapsible>`.

```tsx
<Collapsible>
  <CollapsibleTrigger asChild>
    <div className="flex items-center gap-3 px-4 py-4 hover:bg-muted/50 cursor-pointer transition-colors">
      {/* Status dot */}
      <div
        className="size-[7px] rounded-full shrink-0"
        style={{ background: `var(--color-status-${dotToken})` }}
      />
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{module.name}</p>
        <p className={cn(
          "text-xs mt-0.5",
          module.status === 'blocked'
            ? "text-[var(--color-status-blocked)]"
            : "text-muted-foreground"
        )}>
          {subtitleText}
        </p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </div>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <Separator />
    <div className="px-4 py-4 text-sm text-muted-foreground">
      {/* Module detail — empty in this build, placeholder for future */}
      <p>Module detail coming soon.</p>
    </div>
  </CollapsibleContent>
</Collapsible>
```

`subtitleText` logic:
- `complete` → `Completed ${completedAt}`
- `in_progress` → `nextAction`
- `blocked` → `blockedReason`
- `not_started` → "Not started"

`dotToken` mapped from status:
```ts
const dotToken: Record<StatusId, string> = {
  complete:    'complete',
  in_progress: 'progress',
  blocked:     'blocked',
  not_started: 'idle',
}
```

---

## File structure

### New files
```
components/design/
  carrier-shell.tsx
  carrier-rail.tsx
  carrier-main-pane.tsx
  carrier-topbar.tsx
  spine-nav.tsx
  session-history.tsx
  summary-strip.tsx
  step-results.tsx
  step-objective.tsx
  step-analysis.tsx
  step-design-ops.tsx
  run-card.tsx
  new-run-card.tsx
  insight-card.tsx
  design-ops-module.tsx

lib/
  carrier-types.ts
```

### Modified files
```
app/design-ops/page.tsx     ← swap CarrierClient for CarrierShell
app/globals.css             ← add --color-status-* and --color-insight-* tokens
                              remove old .do-* classes
```

### Deleted files (no other file imports these except design-ops/page.tsx)
```
components/design/design-ops-client.tsx
components/design/design-ops-archive-list.tsx
components/design/design-ops-active-objective-summary.tsx
```

### Kept unchanged
```
components/design/design-ops-crew-runner.tsx
components/design/design-ops-objectives.tsx
components/design/design-ops-objective-fields.tsx
components/design/design-ops-multi-select.tsx
components/design/design-ops-timeline.tsx
components/design/design-ops-findings-summary.tsx
components/design/design-ops-finding-dialog.tsx
components/design/design-ops-finding-section.tsx
components/design/design-ops-finding-digest-card.tsx
hooks/use-design-ops-workspace.ts
lib/design-ops-types.ts
lib/design-ops-formatting.ts
lib/design-ops-label-helpers.ts
lib/design-ops-prompts.ts
app/api/design-ops/          ← all routes unchanged
data/                        ← all JSON unchanged
```

---

## Acceptance criteria

- [ ] Two-pane layout renders at ≥1280px, rail fixed at 220px
- [ ] Rail is always visible, never collapses
- [ ] `page.tsx` mounts `CarrierShell` inside `Suspense`
- [ ] Spine nav shows correct dot color and label for all four status states
- [ ] Any spine step is directly clickable — no forced sequence
- [ ] Active step has left `2.5px` border accent in the rail
- [ ] Workspace opens to first incomplete step on mount
- [ ] "New session" button is visible in rail
- [ ] History section shows past sessions as a list with status dots
- [ ] `CarrierTopbar` renders Private/Shared segmented control and Copy share link
- [ ] `?view=shared` in URL switches to shared render; `?view=private` (or absent) shows private
- [ ] Copy share link copies URL with `?view=shared` and shows a toast
- [ ] Summary strip renders above the fold in both private and shared views
- [ ] Summary strip shows `—` for null fields, not blank or 0
- [ ] "New run" card is always first in the run list, has dashed border
- [ ] Clicking "New run" navigates to Analysis step
- [ ] Run cards show: question, confidence badge, mode badge, recommendation snippet, date
- [ ] Clicking a run card opens a Sheet; Sheet shows timeline (private) or summary (shared)
- [ ] Insight cards show type tag in collapsed state
- [ ] Insight cards expand in private view; expand trigger hidden in shared view
- [ ] Design Ops modules show: dot + name + next action/date in collapsed state
- [ ] Blocked modules show reason in `--color-status-blocked` text
- [ ] No hardcoded hex values in component files — all colors via `var(--color-*)`
- [ ] No inline `style={{}}` except dynamic token lookups (confidence badge, insight tag, status dot)
- [ ] All interactive elements use shadcn variants — no bare `<button>` or `<a>` tags
- [ ] `--color-status-*` and `--color-insight-*` tokens present in `:root` in `globals.css`
- [ ] Old `.do-*` CSS classes removed from `globals.css`
