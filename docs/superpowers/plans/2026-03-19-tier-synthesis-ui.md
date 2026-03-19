# Tier-Specific Synthesis UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add tier selection (Quick/Balanced/In-Depth) to crew runner with visually distinct output cards that reflect synthesis depth.

**Architecture:** Three modular card components route based on synthesis tier metadata. Crew runner adds tier selector radio buttons above prompt. Timeline detects tier from message and renders appropriate card. No changes to backend—crew already supports `synthesis_tier` parameter.

**Tech Stack:** React, TypeScript, shadcn/ui, Tailwind CSS

---

## File Structure

**New files (components/design/synthesis-cards/):**
- `SynthesisCardBase.tsx` — Shared header, agent icon, confidence badge
- `SynthesisCardQuick.tsx` — Minimal variant (headline + 2-3 bullets)
- `SynthesisCardBalanced.tsx` — Standard variant (Finding/Evidence/NextSteps sections)
- `SynthesisCardInDepth.tsx` — Detailed variant (full content + sidebars)
- `index.ts` — Export all cards

**Modified files:**
- `components/design/design-ops-crew-runner.tsx` — Add tier selector radio buttons
- `components/design/design-ops-timeline.tsx` — Add card routing logic
- `lib/design-ops-types.ts` — Update AgentMessage type to include optional `tier` field

---

## Task 1: Create SynthesisCardBase Component

**Files:**
- Create: `components/design/synthesis-cards/SynthesisCardBase.tsx`
- Test: Not directly tested; base for other components

**Description:** Shared wrapper for all three tier variants. Handles agent icon, name, confidence badge, and timeline connector styling.

- [ ] **Step 1: Create file with TypeScript interface**

```typescript
// components/design/synthesis-cards/SynthesisCardBase.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SynthesisCardBaseProps {
  from: "research_insights" | "product_designer";
  fromName: string;
  subject: string;
  confidence?: "high" | "medium" | "low" | "n/a";
  timestamp: string;
  tier?: "quick" | "balanced" | "in-depth";
  borderColor?: string; // e.g., "border-l-[#ff9800]" for quick
  isLast?: boolean;
}

const AGENT_CONFIG: Record<string, { icon: typeof Brain; color: string; label: string }> = {
  research_insights: { icon: FlaskConical, color: "text-emerald-400", label: "RESEARCH & INSIGHTS" },
  product_designer: { icon: Brain, color: "text-violet-400", label: "PRODUCT DESIGNER" },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-red-500/20 text-red-400 border-red-500/30",
  "n/a": "bg-muted text-muted-foreground",
};

export function SynthesisCardBase({
  from,
  fromName,
  subject,
  confidence = "n/a",
  timestamp,
  tier,
  borderColor,
  isLast,
  children,
}: SynthesisCardBaseProps & { children: React.ReactNode }) {
  const agent = AGENT_CONFIG[from] || AGENT_CONFIG.research_insights;
  const Icon = agent.icon;

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isLast && <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />}

      <Card className={cn(
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        borderColor
      )}>
        <CardHeader className="py-3 px-4">
          <div className="flex items-start gap-3">
            {/* Agent avatar */}
            <div className={cn(
              "size-10 rounded-lg bg-muted flex items-center justify-center shrink-0",
              agent.color
            )}>
              <Icon className="size-5" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Agent name + badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-xs font-bold uppercase tracking-wider", agent.color)}>
                  {fromName || agent.label}
                </span>
                {confidence !== "n/a" && (
                  <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", CONFIDENCE_STYLES[confidence])}>
                    {confidence}
                  </Badge>
                )}
              </div>

              {/* Subject */}
              <h3 className="text-sm font-medium mt-1">{subject}</h3>
            </div>
          </div>
        </CardHeader>

        <CardContent className="py-3 px-4">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit base component**

```bash
git add components/design/synthesis-cards/SynthesisCardBase.tsx
git commit -m "feat: create SynthesisCardBase shared component"
```

---

## Task 2: Create SynthesisCardQuick Component

**Files:**
- Create: `components/design/synthesis-cards/SynthesisCardQuick.tsx`

**Description:** Minimal variant showing headline + 2-3 key bullet points. Uses warm orange accent color.

- [ ] **Step 1: Create quick card component**

```typescript
// components/design/synthesis-cards/SynthesisCardQuick.tsx
import { SynthesisCardBase, type SynthesisCardBaseProps } from "./SynthesisCardBase";
import { cn } from "@/lib/utils";

export interface SynthesisCardQuickProps extends SynthesisCardBaseProps {
  headline: string;
  keyPoints: string[]; // 2-3 items
}

export function SynthesisCardQuick({
  headline,
  keyPoints,
  ...baseProps
}: SynthesisCardQuickProps) {
  return (
    <SynthesisCardBase
      {...baseProps}
      tier="quick"
      borderColor="border-l-4 border-l-[#ff9800]"
    >
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-lg">⚡</span>
          <p className="font-semibold text-sm">{headline}</p>
        </div>

        <ul className="space-y-1 pl-6">
          {keyPoints.map((point, i) => (
            <li key={i} className="text-sm text-foreground before:content-['•'] before:mr-2">
              {point}
            </li>
          ))}
        </ul>
      </div>
    </SynthesisCardBase>
  );
}
```

- [ ] **Step 2: Commit quick card**

```bash
git add components/design/synthesis-cards/SynthesisCardQuick.tsx
git commit -m "feat: create SynthesisCardQuick minimal variant"
```

---

## Task 3: Create SynthesisCardBalanced Component

**Files:**
- Create: `components/design/synthesis-cards/SynthesisCardBalanced.tsx`

**Description:** Standard variant with structured sections (Finding/Evidence/NextSteps). Uses blue accent.

- [ ] **Step 1: Create balanced card component**

```typescript
// components/design/synthesis-cards/SynthesisCardBalanced.tsx
import { SynthesisCardBase, type SynthesisCardBaseProps } from "./SynthesisCardBase";
import { cn } from "@/lib/utils";

export interface SynthesisCardBalancedProps extends SynthesisCardBaseProps {
  finding: string;
  evidence: string[];
  nextSteps: string;
}

export function SynthesisCardBalanced({
  finding,
  evidence,
  nextSteps,
  ...baseProps
}: SynthesisCardBalancedProps) {
  return (
    <SynthesisCardBase
      {...baseProps}
      tier="balanced"
      borderColor="border-l-4 border-l-[#2196f3]"
    >
      <div className="space-y-4">
        {/* Finding */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Finding
          </h4>
          <p className="text-sm">{finding}</p>
        </div>

        {/* Evidence */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Evidence
          </h4>
          <ul className="space-y-1 pl-6">
            {evidence.map((item, i) => (
              <li key={i} className="text-sm text-foreground before:content-['•'] before:mr-2">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Next Steps
          </h4>
          <p className="text-sm">{nextSteps}</p>
        </div>
      </div>
    </SynthesisCardBase>
  );
}
```

- [ ] **Step 2: Commit balanced card**

```bash
git add components/design/synthesis-cards/SynthesisCardBalanced.tsx
git commit -m "feat: create SynthesisCardBalanced standard variant"
```

---

## Task 4: Create SynthesisCardInDepth Component

**Files:**
- Create: `components/design/synthesis-cards/SynthesisCardInDepth.tsx`

**Description:** Detailed variant with main content area + right sidebars for metadata (confidence/sources, assumptions). Uses purple accent with grid layout.

- [ ] **Step 1: Create in-depth card component**

```typescript
// components/design/synthesis-cards/SynthesisCardInDepth.tsx
import { SynthesisCardBase, type SynthesisCardBaseProps } from "./SynthesisCardBase";
import { cn } from "@/lib/utils";

export interface SynthesisCardInDepthProps extends SynthesisCardBaseProps {
  finding: string;
  evidence: string[];
  competingInterpretations?: string;
  assumptions?: string;
  sources?: string[];
  nextSteps: string;
  missingContext?: string;
}

export function SynthesisCardInDepth({
  finding,
  evidence,
  competingInterpretations,
  assumptions,
  sources,
  nextSteps,
  missingContext,
  ...baseProps
}: SynthesisCardInDepthProps) {
  return (
    <SynthesisCardBase
      {...baseProps}
      tier="in-depth"
      borderColor="border-l-4 border-l-[#9c27b0]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Finding */}
          <div>
            <p className="text-sm font-semibold flex items-center gap-2">
              <span>🔬</span> {finding}
            </p>
          </div>

          {/* Evidence */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Evidence
            </h4>
            <ul className="space-y-1 pl-6">
              {evidence.map((item, i) => (
                <li key={i} className="text-sm text-foreground before:content-['•'] before:mr-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Competing Interpretations */}
          {competingInterpretations && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Competing Interpretations
              </h4>
              <p className="text-sm">{competingInterpretations}</p>
            </div>
          )}

          {/* Next Steps */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Next Steps
            </h4>
            <p className="text-sm">{nextSteps}</p>
          </div>

          {missingContext && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Missing Context
              </h4>
              <p className="text-sm text-muted-foreground">{missingContext}</p>
            </div>
          )}
        </div>

        {/* Sidebars */}
        <div className="space-y-3">
          {/* Confidence + Sources */}
          {sources && sources.length > 0 && (
            <div className="bg-muted rounded-lg p-3 border border-border">
              <h5 className="text-xs font-semibold uppercase tracking-wider mb-2">Sources</h5>
              <ul className="space-y-1">
                {sources.map((source, i) => (
                  <li key={i} className="text-xs text-muted-foreground">{source}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Assumptions */}
          {assumptions && (
            <div className="bg-muted rounded-lg p-3 border border-border">
              <h5 className="text-xs font-semibold uppercase tracking-wider mb-2">Assumptions</h5>
              <p className="text-xs text-muted-foreground">{assumptions}</p>
            </div>
          )}
        </div>
      </div>
    </SynthesisCardBase>
  );
}
```

- [ ] **Step 2: Commit in-depth card**

```bash
git add components/design/synthesis-cards/SynthesisCardInDepth.tsx
git commit -m "feat: create SynthesisCardInDepth detailed variant"
```

---

## Task 5: Create Index & Export

**Files:**
- Create: `components/design/synthesis-cards/index.ts`

**Description:** Export all synthesis card components for easy importing.

- [ ] **Step 1: Create index file**

```typescript
// components/design/synthesis-cards/index.ts
export { SynthesisCardBase, type SynthesisCardBaseProps } from "./SynthesisCardBase";
export { SynthesisCardQuick, type SynthesisCardQuickProps } from "./SynthesisCardQuick";
export { SynthesisCardBalanced, type SynthesisCardBalancedProps } from "./SynthesisCardBalanced";
export { SynthesisCardInDepth, type SynthesisCardInDepthProps } from "./SynthesisCardInDepth";
```

- [ ] **Step 2: Commit exports**

```bash
git add components/design/synthesis-cards/index.ts
git commit -m "feat: create synthesis-cards barrel export"
```

---

## Task 6: Update Design Ops Types

**Files:**
- Modify: `lib/design-ops-types.ts`

**Description:** Add optional `tier` field to AgentMessage interface.

- [ ] **Step 1: Read current types file**

Check what AgentMessage currently looks like.

- [ ] **Step 2: Add tier field to AgentMessage**

```typescript
// In lib/design-ops-types.ts, update AgentMessage interface:

export interface AgentMessage {
  from: string;
  fromName?: string;
  to?: string;
  subject: string;
  priority?: "standard" | "critical";
  confidence?: "high" | "medium" | "low" | "n/a";
  body: string;
  timestamp: string;
  tier?: "quick" | "balanced" | "in-depth"; // ADD THIS LINE
}
```

- [ ] **Step 3: Commit type updates**

```bash
git add lib/design-ops-types.ts
git commit -m "feat: add tier field to AgentMessage type"
```

---

## Task 7: Add Tier Selector to Crew Runner

**Files:**
- Modify: `components/design/design-ops-crew-runner.tsx`

**Description:** Add radio button group for tier selection above prompt textarea.

- [ ] **Step 1: Import necessary components**

Add to imports:
```typescript
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
```

- [ ] **Step 2: Add tier state to component**

In the component function, after `const [running, setRunning]` line, add:
```typescript
const [synthesisT tier, setSynthesisTier] = useState<"quick" | "balanced" | "in-depth">("balanced");
```

- [ ] **Step 3: Add tier to form data**

In the `handleRun` function, update the POST body:
```typescript
body: JSON.stringify({
  prompt: prompt.trim(),
  objectives: selected,
  synthesis_tier: synthesisT tier,  // ADD THIS LINE
})
```

- [ ] **Step 4: Add tier selector UI**

Before the prompt textarea, add:
```jsx
<div className="mb-4 space-y-2">
  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    Synthesis Tier
  </Label>
  <RadioGroup value={synthesisT tier} onValueChange={(val) => setSynthesisTier(val as any)}>
    <div className="flex gap-3">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="quick" id="tier-quick" />
        <Label htmlFor="tier-quick" className="font-normal cursor-pointer">
          ⚡ Quick
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="balanced" id="tier-balanced" />
        <Label htmlFor="tier-balanced" className="font-normal cursor-pointer">
          ⚙️ Balanced
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="in-depth" id="tier-indepth" />
        <Label htmlFor="tier-indepth" className="font-normal cursor-pointer">
          🔬 In-Depth
        </Label>
      </div>
    </div>
  </RadioGroup>
</div>
```

- [ ] **Step 5: Commit tier selector**

```bash
git add components/design/design-ops-crew-runner.tsx
git commit -m "feat: add tier selector radio buttons to crew runner"
```

---

## Task 8: Update Timeline to Route Cards by Tier

**Files:**
- Modify: `components/design/design-ops-timeline.tsx`

**Description:** Import synthesis card components and route messages to correct component based on tier.

- [ ] **Step 1: Add imports**

```typescript
import {
  SynthesisCardQuick,
  SynthesisCardBalanced,
  SynthesisCardInDepth,
  type SynthesisCardQuickProps,
  type SynthesisCardBalancedProps,
  type SynthesisCardInDepthProps,
} from "@/components/design/synthesis-cards";
```

- [ ] **Step 2: Replace timeline card rendering logic**

Find the existing message.map() loop that renders cards. Replace the card rendering with:

```typescript
return (
  <div key={i} className="relative">
    {!isLast && <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />}

    {/* Route to correct card component based on tier */}
    {msg.tier === "quick" ? (
      <SynthesisCardQuick
        from={msg.from as any}
        fromName={msg.fromName || ""}
        subject={msg.subject}
        confidence={msg.confidence as any}
        timestamp={msg.timestamp}
        tier="quick"
        headline={msg.subject}
        keyPoints={(msg.body || "").split("\n").filter(l => l.trim()).slice(0, 3)}
        isLast={isLast}
      />
    ) : msg.tier === "in-depth" ? (
      <SynthesisCardInDepth
        from={msg.from as any}
        fromName={msg.fromName || ""}
        subject={msg.subject}
        confidence={msg.confidence as any}
        timestamp={msg.timestamp}
        tier="in-depth"
        finding={msg.subject}
        evidence={[]}
        nextSteps={msg.body || ""}
        isLast={isLast}
      />
    ) : (
      <SynthesisCardBalanced
        from={msg.from as any}
        fromName={msg.fromName || ""}
        subject={msg.subject}
        confidence={msg.confidence as any}
        timestamp={msg.timestamp}
        tier="balanced"
        finding={msg.subject}
        evidence={[]}
        nextSteps={msg.body || ""}
        isLast={isLast}
      />
    )}
  </div>
);
```

Note: This is a simplified routing. The actual data mapping depends on how crew backend sends the structured data. Plan for refinement in next task.

- [ ] **Step 3: Commit timeline updates**

```bash
git add components/design/design-ops-timeline.tsx
git commit -m "feat: add tier-based card routing to timeline"
```

---

## Task 9: Test Tier Selector in Browser

**Files:**
- Test: Manual browser testing

**Description:** Verify tier selector appears and changes, and results render with correct cards.

- [ ] **Step 1: Start dev server**

```bash
cd /Users/miguelarias/Code/design-tools
npm run dev
```

Expected: Server starts on port 3500

- [ ] **Step 2: Navigate to Design Ops page**

Open browser to `http://localhost:3500/design-ops`

Expected: Design Ops page loads with crew runner visible

- [ ] **Step 3: Verify tier selector visible**

Look above the prompt textarea.

Expected: Three radio buttons: ⚡ Quick, ⚙️ Balanced (selected), 🔬 In-Depth

- [ ] **Step 4: Test tier selection**

Click each tier option.

Expected: Selection state changes, no errors in console

- [ ] **Step 5: Test crew run with Quick tier**

1. Select "Quick" tier
2. Enter sample prompt: "Users struggle to find content"
3. Select an objective
4. Click "Run Synthesis"
5. Wait for response

Expected: Results appear in timeline with Quick card styling (orange border, minimal bullets)

- [ ] **Step 6: Test with Balanced tier**

Repeat step 5 with "Balanced" selected.

Expected: Results appear with Balanced card styling (blue border, structured sections)

- [ ] **Step 7: Note data flow issues**

If card rendering shows empty content or incorrect data mapping, document in notes for refinement task.

---

## Task 10: Refine Data Mapping (Crew Output → Card Props)

**Files:**
- Modify: `components/design/design-ops-timeline.tsx` (further refinement)
- Possibly: `crew/main.py` or task files (if backend needs to structure output per tier)

**Description:** Map crew's SSE output to the correct card component props. This task depends on actual crew output format.

- [ ] **Step 1: Inspect actual crew response structure**

Run a synthesis and log the SSE messages to console. Check what fields are in `msg.body` and how it's structured.

```typescript
// In timeline component, temporarily add logging:
console.log("Message from crew:", msg);
```

- [ ] **Step 2: Parse crew output by tier**

Based on observed structure, write parser functions:

```typescript
function parseQuickOutput(body: string): { headline: string; keyPoints: string[] } {
  // Parse minimized output
  const lines = body.split("\n");
  return {
    headline: lines[0] || "",
    keyPoints: lines.slice(1, 4).filter(l => l.trim()),
  };
}

function parseBalancedOutput(body: string): { finding: string; evidence: string[]; nextSteps: string } {
  // Parse structured sections
  // Look for FINDING:, EVIDENCE:, NEXT STEPS: markers
  // ...
}
```

- [ ] **Step 3: Update timeline routing to use parsers**

Replace the simplified routing with proper data mapping.

- [ ] **Step 4: Commit refinement**

```bash
git add components/design/design-ops-timeline.tsx
git commit -m "refactor: add crew output parsers for tier-specific cards"
```

---

## Task 11: Final Integration Test

**Files:**
- Test: Manual end-to-end testing

**Description:** Full workflow test: select tier → run synthesis → verify output cards render correctly.

- [ ] **Step 1: Clear cache and restart server**

```bash
rm -rf .next/
npm run dev
```

- [ ] **Step 2: Test Quick tier workflow**

1. Set tier to Quick
2. Run synthesis with sample data
3. Verify Quick card appears with orange border, 2-3 bullets only

Expected: Card is compact, no detailed sections

- [ ] **Step 3: Test Balanced tier workflow**

1. Set tier to Balanced
2. Run synthesis with same data
3. Verify Balanced card appears with blue border, Finding/Evidence/NextSteps sections

Expected: Card shows structured content

- [ ] **Step 4: Test In-Depth tier workflow**

1. Set tier to In-Depth
2. Run synthesis with same data
3. Verify In-Depth card appears with purple border, main content + sidebars

Expected: Card shows full details with metadata sidebars

- [ ] **Step 5: Test mixed timeline**

1. Run Quick synthesis
2. Run Balanced synthesis
3. Run In-Depth synthesis
4. View timeline

Expected: All three card styles render correctly, timeline connectors appear, no layout breaks

- [ ] **Step 6: Test dark mode**

Toggle dark mode (if available in sidebar).

Expected: All three card variants respect dark mode, text is readable

- [ ] **Step 7: Commit final state**

```bash
git add -A
git commit -m "feat: complete tier-specific synthesis UI integration"
```

---

## Testing Checklist

- [ ] Tier selector radio buttons render
- [ ] Tier state updates on selection
- [ ] Selected tier is sent to crew API
- [ ] Quick cards render with minimal content
- [ ] Balanced cards render with structured sections
- [ ] In-Depth cards render with sidebars
- [ ] Timeline connectors work with new cards
- [ ] Dark mode works for all card types
- [ ] No console errors
- [ ] Responsive on mobile (if applicable)

---

## Notes for Refinement

1. **Data Mapping:** The crew output format needs to be inspected to properly parse into card props. Task 10 handles this discovery.
2. **Crew Backend:** Already supports `synthesis_tier` parameter—no backend changes needed.
3. **Styling:** Uses existing Carrier design tokens. New left borders (quick/balanced/in-depth colors) should be added to Tailwind config if not present.
4. **Accessibility:** All radio buttons and card content should be screen reader accessible. Verify in testing.

---

## Success Criteria

✓ Tier selector appears in crew runner form
✓ Three tier options are selectable
✓ Selected tier is sent to crew backend
✓ Three visually distinct card types render
✓ Cards populate with crew synthesis data
✓ Timeline displays mix of tier outputs
✓ Dark mode works for all variants
✓ No breaking changes to existing UI
✓ Code follows Carrier's component patterns
