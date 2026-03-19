# Tier-Specific Synthesis UI Design

**Date:** 2026-03-19
**Project:** Carrier Design Tool
**Feature:** Synthesis Tier Selection & Output Display
**Status:** Design Approved

---

## Overview

Add user-facing tier selection (Quick/Balanced/In-Depth) to the crew synthesis runner, with visually distinct output cards that reflect synthesis depth. This makes the crew nimble—researchers can choose snappy feedback or thorough analysis based on context.

**Goals:**
- Make synthesis tier selection explicit and discoverable
- Visually distinguish tier outputs so users understand what they're getting
- Create modular, maintainable components that follow Carrier's design patterns
- No breaking changes to existing crew infrastructure

---

## Design Decisions

### 1. Tier Selector Placement: Above Prompt Input (Option A)

**Where:** DesignOpsCrewRunner, above the prompt textarea

**UI:**
- Label: "Synthesis Tier"
- Three labeled radio buttons: `⚡ Quick`, `⚙️ Balanced`, `🔬 In-Depth`
- Uses Carrier's default `rounded-lg` radius and spacing
- Balanced tier is selected by default
- Each button shows full text (not abbreviations) for clarity

**Implementation:**
```
[Synthesis Tier]
[⚡ Quick] [⚙️ Balanced (selected)] [🔬 In-Depth]

[Focus Prompt textareaarea...]

[Run Synthesis button]
```

**Why Option A:**
- Clear and discoverable at first glance
- Explicit choice before running—no hidden defaults
- Pairs naturally with the prompt input
- Room for future tier descriptions/tooltips

---

### 2. Output Display: Distinct Card Styles (Option D)

**Principle:** Each tier renders in a visually distinct card format, making tier selection visible in results.

#### Quick Tier Card
- **Visual:** Minimal, light background (warm accent color #fff9e6)
- **Content:**
  - One-line headline with icon (⚡)
  - 2-3 key bullet points only
  - Confidence badge
  - **No:** sections, assumptions, competing interpretations
- **Use case:** Fast feedback loops, initial pattern spotting

#### Balanced Tier Card
- **Visual:** Standard white card (current Design Ops timeline style)
- **Content:**
  - Agent header with confidence badge
  - Structured sections: Finding / Evidence / Next Steps
  - Clearly labeled section headers (uppercase, small)
  - Full findings with context
- **Use case:** Default analysis, most production runs

#### In-Depth Tier Card
- **Visual:** Distinct background (purple accent #f3e5f5) with sidebar layout
- **Content:**
  - Main area: Full finding + evidence + competing interpretations
  - Right sidebar(s):
    - Confidence + sources
    - Assumptions + reasoning
  - Expanded reasoning chains
- **Use case:** Foundational decisions, contradictory signals, stakeholder reviews

**Color Coding (via left border):**
- Quick: Orange (#ff9800)
- Balanced: Blue (#2196f3)
- In-Depth: Purple (#9c27b0)

---

### 3. Component Architecture: Three Separate Components (Option B)

**File Structure:**
```
components/design/
├── synthesis-cards/
│   ├── SynthesisCardBase.tsx        (shared header/styling)
│   ├── SynthesisCardQuick.tsx       (minimal variant)
│   ├── SynthesisCardBalanced.tsx    (standard variant)
│   └── SynthesisCardInDepth.tsx     (detailed variant)
└── design-ops-crew-runner.tsx       (updated to include tier selector)
```

**Component APIs:**

```typescript
// Shared base
interface SynthesisCardBaseProps {
  from: "research_insights" | "product_designer";
  fromName: string;
  subject: string;
  confidence: "high" | "medium" | "low";
  timestamp: string;
}

// Quick variant
interface SynthesisCardQuickProps extends SynthesisCardBaseProps {
  headline: string;
  keyPoints: string[];  // 2-3 items
}

// Balanced variant
interface SynthesisCardBalancedProps extends SynthesisCardBaseProps {
  finding: string;
  evidence: string[];
  nextSteps: string;
}

// In-Depth variant
interface SynthesisCardInDepthProps extends SynthesisCardBaseProps {
  finding: string;
  evidence: string[];
  competingInterpretations?: string;
  assumptions?: string;
  sources?: string[];
  nextSteps: string;
  missingContext?: string;
}
```

**Shared Behaviors:**
- All render agent icon + name + confidence badge
- All use Carrier's design tokens (colors, spacing, typography)
- All animate in with `animate-in fade-in slide-in-from-bottom-2`
- All support timeline connectors (vertical line between cards)

---

## Integration Points

### 1. Crew Runner (design-ops-crew-runner.tsx)

**Changes:**
- Add tier radio button group to form
- Pass selected `synthesisT tier` to `/api/design-ops/run` payload
- Existing SSE stream logic unchanged

**Updated Request:**
```json
{
  "prompt": "...",
  "objectives": [...],
  "synthesis_tier": "quick|balanced|in-depth"
}
```

### 2. Crew Service API (main.py)

**Changes:**
- Already accepts `synthesis_tier` parameter ✓
- Already passes through to tasks ✓
- No additional changes needed

### 3. Timeline Component (design-ops-timeline.tsx)

**Changes:**
- Import the three synthesis card components
- Detect `tier` from message metadata
- Route to correct component based on tier
- Existing timeline structure (connectors, spacing) preserved

**Logic:**
```typescript
if (msg.from === "research_insights" || msg.from === "product_designer") {
  const tier = msg.tier || "balanced";  // default to balanced

  switch(tier) {
    case "quick":
      return <SynthesisCardQuick {...props} />;
    case "in-depth":
      return <SynthesisCardInDepth {...props} />;
    default:
      return <SynthesisCardBalanced {...props} />;
  }
}
```

---

## Data Flow

```
User selects tier
      ↓
Crew Runner stores tier in state
      ↓
User clicks "Run Synthesis"
      ↓
POST /api/design-ops/run { synthesis_tier, prompt, objectives }
      ↓
Crew backend uses tier to configure synthesis depth
      ↓
Agent outputs match expected tier structure
      ↓
Timeline receives message with tier metadata
      ↓
Timeline routes to correct card component
      ↓
Card renders tier-specific layout
```

---

## Styling & Theming

**Uses Carrier's existing design system:**
- Colors: `text-foreground`, `bg-muted`, `border-border`, plus accent colors
- Spacing: Modular scale (px-3, py-2, gap-2, etc.)
- Typography: `text-sm`, `font-semibold`, `uppercase tracking-wide`
- Radius: `rounded-lg` for cards, `rounded-md` for buttons
- Dark mode: Works via `.dark` class (already supported)

**New utility classes (if needed):**
- `.tier-indicator` — left border + background color per tier
- `.tier-badge` — small label with background (Quick/Balanced/In-Depth)

---

## Backward Compatibility

✓ **No breaking changes:**
- Default tier is `balanced` (current behavior)
- Timeline unchanged if no tier metadata
- Existing messages render as balanced tier
- Can toggle feature on/off via UI alone

---

## Success Criteria

✓ Tier selector is discoverable in runner form
✓ Three distinct card layouts render correctly per tier
✓ Timeline displays mix of tier outputs cleanly
✓ Dark mode works for all three card variants
✓ Components follow Carrier's modular patterns
✓ No performance regression in timeline rendering

---

## Future Enhancements

1. **Tier descriptions** — Hover tooltips explaining Quick/Balanced/In-Depth
2. **Auto-escalation** — Detect contradictions in synthesis, suggest In-Depth
3. **Tier persistence** — Remember user's preferred tier between sessions
4. **Confidence-based routing** — If research confidence is Low, auto-suggest In-Depth
5. **Export variants** — Allow users to re-run same data at different tier

---

## Questions for Review

- Does the radio button placement feel right in the crew runner form?
- Are the three card layouts distinct enough visually?
- Should tier badges appear on balanced cards too, or only on Quick/In-Depth?
- Any concerns about adding sidebar layout to In-Depth cards?
