# Tier-Specific Synthesis UI — Session Handoff

**Status:** Design approved, implementation plan written, ready for execution
**Date:** 2026-03-19
**Session:** Context exhausted at 90% during plan review

---

## What's Complete

✅ **Design Spec:** `/docs/superpowers/specs/2026-03-19-tier-synthesis-ui-design.md`
- Tier selector placement: **Option A** (radio buttons above prompt)
- Output display: **Option D** (distinct card styles per tier)
- Component architecture: **Option B** (three separate components)

✅ **Implementation Plan:** `/docs/superpowers/plans/2026-03-19-tier-synthesis-ui.md`
- 11 bite-sized tasks with complete code samples
- File structure defined
- Testing strategy documented

✅ **Backend Integration:** Already supports `synthesis_tier` parameter
- No crew service changes needed
- No API changes needed

---

## What's Next: Start Fresh Session

**In your next session, launch with:**

```bash
cd /Users/miguelarias/Code/design-tools
git checkout -b feat/tier-synthesis-ui
```

Then invoke the subagent-driven-development skill:

```
Use superpowers:subagent-driven-development to execute the tier-specific synthesis UI implementation plan from /Users/miguelarias/Code/design-tools/docs/superpowers/plans/2026-03-19-tier-synthesis-ui.md. Start with Task 1 (Create SynthesisCardBase Component). Use fresh subagents per task, review output quality, and proceed through all 11 tasks sequentially.
```

---

## Plan Overview (Quick Reference)

### Tasks 1-5: Create Synthesis Card Components
- **Task 1:** SynthesisCardBase (shared header/styling)
- **Task 2:** SynthesisCardQuick (minimal, orange border)
- **Task 3:** SynthesisCardBalanced (standard, blue border)
- **Task 4:** SynthesisCardInDepth (detailed, purple border)
- **Task 5:** Index/export barrel

### Tasks 6-8: Wire UI & Types
- **Task 6:** Add `tier` field to AgentMessage type
- **Task 7:** Add tier selector radio buttons to DesignOpsCrewRunner
- **Task 8:** Update DesignOpsTimeline to route by tier

### Tasks 9-11: Testing & Refinement
- **Task 9:** Browser testing (tier selector visibility & card rendering)
- **Task 10:** Data mapping refinement (parse crew output → card props)
- **Task 11:** Final integration test (E2E workflow test)

---

## Key Design Decisions

**Tier Selector (Option A):**
```
[Synthesis Tier]
[⚡ Quick] [⚙️ Balanced (default)] [🔬 In-Depth]
```

**Card Styles (Option D):**
- **Quick:** Minimal, orange left border (#ff9800), 2-3 bullets
- **Balanced:** Standard (current), blue left border (#2196f3), Finding/Evidence/NextSteps
- **In-Depth:** Detailed, purple left border (#9c27b0), main + sidebars (sources, assumptions)

**Component Pattern (Option B):**
- `SynthesisCardBase` (shared)
- `SynthesisCardQuick` (extends base)
- `SynthesisCardBalanced` (extends base)
- `SynthesisCardInDepth` (extends base)

---

## Files to Create

```
components/design/synthesis-cards/
├── SynthesisCardBase.tsx
├── SynthesisCardQuick.tsx
├── SynthesisCardBalanced.tsx
├── SynthesisCardInDepth.tsx
└── index.ts
```

## Files to Modify

```
components/design/design-ops-crew-runner.tsx    (add tier selector)
components/design/design-ops-timeline.tsx        (add card routing)
lib/design-ops-types.ts                          (add tier field)
```

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

---

## Notes

1. **Data Mapping:** Task 10 inspects actual crew SSE output format and writes parsers
2. **No Backend Changes:** Crew already supports `synthesis_tier` parameter
3. **Styling:** Uses existing Carrier design tokens; left borders rely on Tailwind's arbitrary color support (`border-l-[#ff9800]`)
4. **Dark Mode:** All components use `bg-muted` / `text-foreground` tokens which respect dark class

---

## Resources

- **Design Mockups:** `/docs/tier-selector-options.html` and `/docs/tier-output-display-options.html` (served at http://localhost:8888)
- **Product Context:** `/docs/RAPTIVE_COMMUNITY_CONTEXT.md`
- **Crew System Docs:** `/docs/carrier-crew-system.md`

---

**Ready to continue in fresh session. Good luck! 🚀**
