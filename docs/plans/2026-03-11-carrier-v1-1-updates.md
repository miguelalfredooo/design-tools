# Carrier V1.1 Updates Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add the first Carrier V1.1 product updates: visible data-confidence handling, a lightweight validation workflow, and a discoverable design-guidance layer that supports future AI-assisted design work.

**Architecture:** Start with the thinnest vertical slice already implied by the product: a shared confidence model, visible confidence states on the Creator Tools drop, and a reusable validation metadata structure that can later extend into sessions, insight batches, and project drops. In parallel, split and surface the Carrier documentation so the product spec and design-ops guidance are both findable from inside the workspace.

**Tech Stack:** Next.js App Router, React 19, TypeScript, local mock data, existing Carrier UI primitives, Node test runner, ESLint

---

## Scope For This Plan

This plan covers:

- product documentation split and cleanup
- shared data-confidence domain model
- first visible confidence treatment on Creator Tools
- session-level validation metadata plumbing
- drop-level evidence anchor enforcement in the prototype
- discoverable design-guidance surface inside Carrier

This plan does **not** cover:

- real analytics-platform integrations
- automatic data verification
- actual AI-agent execution against the design principles
- multi-role permissions beyond the existing lightweight admin model

---

### Task 1: Normalize Carrier Documentation

**Files:**
- Modify: `docs/carrier-prd-design.md`
- Create: `docs/carrier-design-ops.md`
- Test: review in browser or markdown preview

**Step 1: Review the split docs against the addendum**

Check that:
- product requirements stay in `docs/carrier-prd-design.md`
- operating guidance moves to `docs/carrier-design-ops.md`
- duplicated AI/design-ops content is removed from the PRD

**Step 2: Tighten the PRD structure**

Ensure the PRD remains product-facing:
- scope
- user flows
- requirements
- acceptance criteria
- open questions

**Step 3: Tighten the design-ops doc**

Ensure the design-ops doc captures:
- feature advocacy framework
- PM collaboration norms
- data integrity expectations
- AI-assisted design direction

**Step 4: Verify docs are linked**

Confirm:
- `docs/carrier-prd-design.md` references `docs/carrier-design-ops.md`
- both docs are present in the repo and readable

**Step 5: Commit**

```bash
git add docs/carrier-prd-design.md docs/carrier-design-ops.md
git commit -m "docs: split carrier prd and design ops"
```

---

### Task 2: Establish A Shared Data Confidence Model

**Files:**
- Create: `lib/data-confidence.ts`
- Modify: `lib/mock/creator-tools.ts`
- Test: `test/creator-tools-confidence.test.mjs`

**Step 1: Write the failing test**

Add or extend:
- `test/creator-tools-confidence.test.mjs`

Test behaviors:
- Creator Tools overview exposes a data confidence summary
- Creator Tools mock data includes `unverified`, `in_review`, and `confirmed`

**Step 2: Run test to verify it fails**

Run:

```bash
node --test test/creator-tools-confidence.test.mjs
```

Expected:
- FAIL because the overview lacks confidence summary copy and the mock data lacks confidence states

**Step 3: Add the confidence domain model**

In `lib/data-confidence.ts` add:
- `DataConfidenceState`
- `DataConfidenceMeta`
- display metadata for badges and color treatments

**Step 4: Add confidence metadata to Carrier mock data**

In `lib/mock/creator-tools.ts` add:
- one confirmed evidence anchor summary
- KPI confidence metadata
- finding confidence metadata

Keep it minimal and obviously mock-backed.

**Step 5: Run test to verify it passes**

Run:

```bash
node --test test/creator-tools-confidence.test.mjs
```

Expected:
- PASS

**Step 6: Commit**

```bash
git add lib/data-confidence.ts lib/mock/creator-tools.ts test/creator-tools-confidence.test.mjs
git commit -m "feat: add carrier data confidence model"
```

---

### Task 3: Surface Confidence On Creator Tools Overview

**Files:**
- Modify: `app/drops/creator-tools/page.tsx`
- Test: `test/creator-tools-confidence.test.mjs`

**Step 1: Extend the failing test if needed**

Add assertions for:
- a visible `Data confidence` section
- at least one `Confirmed evidence anchor`

**Step 2: Verify the test still fails for the right reason**

Run:

```bash
node --test test/creator-tools-confidence.test.mjs
```

Expected:
- FAIL until the overview page renders the confidence content

**Step 3: Add minimal UI**

In `app/drops/creator-tools/page.tsx`:
- add a small summary band for data confidence
- show counts/labels for confidence states
- show one confirmed evidence anchor summary
- add per-KPI and per-finding confidence badges

Do not attempt a full validation workflow yet. Just make the distinction visible.

**Step 4: Run the test**

Run:

```bash
node --test test/creator-tools-confidence.test.mjs
```

Expected:
- PASS

**Step 5: Lint the page**

Run:

```bash
npx eslint app/drops/creator-tools/page.tsx lib/mock/creator-tools.ts lib/data-confidence.ts test/creator-tools-confidence.test.mjs
```

Expected:
- no lint errors

**Step 6: Commit**

```bash
git add app/drops/creator-tools/page.tsx lib/mock/creator-tools.ts lib/data-confidence.ts test/creator-tools-confidence.test.mjs
git commit -m "feat: show data confidence on creator tools overview"
```

---

### Task 4: Add Session-Level Validation Metadata

**Files:**
- Modify: `lib/design-types.ts`
- Modify: `app/new/page.tsx`
- Modify: `app/explorations/[id]/page.tsx`
- Modify: `lib/design-store.tsx`
- Test: create `test/session-validation-metadata.test.mjs`

**Step 1: Write the failing test**

Create `test/session-validation-metadata.test.mjs` to assert:
- session model supports validation metadata
- session creation flow accepts evidence-validation fields

Use a file-content contract test if no existing runtime test harness exists.

**Step 2: Run it and confirm failure**

Run:

```bash
node --test test/session-validation-metadata.test.mjs
```

Expected:
- FAIL because the session model does not yet expose validation metadata

**Step 3: Add the minimal model**

In `lib/design-types.ts`, add a small validation shape:
- session-level confidence summary
- optional evidence anchor metadata

In `lib/design-store.tsx`, pass the new data through create/load logic.

**Step 4: Extend the session create flow**

In `app/new/page.tsx`, add the smallest possible UI:
- evidence anchor source
- confidence state selector
- optional owner / verification date

Keep this behind the context brief area. Do not over-design it.

**Step 5: Surface the metadata on session detail**

In `app/explorations/[id]/page.tsx`, add:
- a compact confidence summary
- clear labeling between directional and confirmed evidence

**Step 6: Re-run tests**

Run:

```bash
node --test test/session-validation-metadata.test.mjs
```

Expected:
- PASS

**Step 7: Lint changed files**

Run:

```bash
npx eslint lib/design-types.ts lib/design-store.tsx app/new/page.tsx app/explorations/[id]/page.tsx test/session-validation-metadata.test.mjs
```

**Step 8: Commit**

```bash
git add lib/design-types.ts lib/design-store.tsx app/new/page.tsx app/explorations/[id]/page.tsx test/session-validation-metadata.test.mjs
git commit -m "feat: add session validation metadata"
```

---

### Task 5: Add Drop Publish Guardrails For Evidence Anchors

**Files:**
- Modify: `app/drops/creator-tools/page.tsx`
- Modify: `app/drops/creator-tools/prd/page.tsx`
- Possibly modify: `lib/mock/creator-tools.ts`
- Test: create `test/drop-evidence-anchor.test.mjs`

**Step 1: Write the failing test**

Add a test that asserts:
- project drop overview surfaces one confirmed evidence anchor
- drop content distinguishes emerging signal vs confirmed evidence

**Step 2: Run it and verify it fails**

Run:

```bash
node --test test/drop-evidence-anchor.test.mjs
```

**Step 3: Add the smallest viable guardrail**

Prototype behavior only:
- show a drop-level evidence summary
- label recommendation blocks as based on confirmed vs emerging evidence
- add a visible warning if no confirmed anchor exists in mock data

Do not build an actual publish workflow yet.

**Step 4: Re-run tests**

Run:

```bash
node --test test/drop-evidence-anchor.test.mjs
```

**Step 5: Lint**

Run:

```bash
npx eslint app/drops/creator-tools/page.tsx app/drops/creator-tools/prd/page.tsx lib/mock/creator-tools.ts test/drop-evidence-anchor.test.mjs
```

**Step 6: Commit**

```bash
git add app/drops/creator-tools/page.tsx app/drops/creator-tools/prd/page.tsx lib/mock/creator-tools.ts test/drop-evidence-anchor.test.mjs
git commit -m "feat: add drop evidence anchor guardrails"
```

---

### Task 6: Make Design Guidance Findable In Carrier

**Files:**
- Create: `app/guidance/page.tsx`
- Create: `lib/mock/design-guidance.ts`
- Modify: `components/design/design-sidebar.tsx`
- Modify: `docs/carrier-design-ops.md`
- Test: create `test/design-guidance-route.test.mjs`

**Step 1: Write the failing test**

Create `test/design-guidance-route.test.mjs` asserting:
- sidebar includes a guidance destination
- guidance page includes design principles and usage intent

**Step 2: Run it and confirm failure**

Run:

```bash
node --test test/design-guidance-route.test.mjs
```

**Step 3: Add the minimal guidance surface**

Create `app/guidance/page.tsx` with:
- Carrier design principles
- pattern guidance
- links back to relevant docs

Back it with `lib/mock/design-guidance.ts` so the content is structured now, not buried directly in JSX.

**Step 4: Add navigation**

In `components/design/design-sidebar.tsx`, add a new top-level nav item or secondary workspace item for Guidance.

Keep naming simple: `Guidance`.

**Step 5: Re-run tests**

Run:

```bash
node --test test/design-guidance-route.test.mjs
```

**Step 6: Lint**

Run:

```bash
npx eslint app/guidance/page.tsx lib/mock/design-guidance.ts components/design/design-sidebar.tsx test/design-guidance-route.test.mjs
```

**Step 7: Commit**

```bash
git add app/guidance/page.tsx lib/mock/design-guidance.ts components/design/design-sidebar.tsx docs/carrier-design-ops.md test/design-guidance-route.test.mjs
git commit -m "feat: add carrier design guidance surface"
```

---

### Task 7: Reuse Confidence Semantics In Insights

**Files:**
- Modify: `components/design/research-client.tsx`
- Modify: `lib/research-types.ts`
- Possibly modify: `app/research/page.tsx`
- Test: create `test/research-confidence-copy.test.mjs`

**Step 1: Write the failing test**

Assert:
- insights use consistent confidence terminology
- confidence badges read as part of the same system as drop/session confidence

**Step 2: Run it and verify failure**

Run:

```bash
node --test test/research-confidence-copy.test.mjs
```

**Step 3: Normalize confidence display**

Use `lib/data-confidence.ts` semantics where appropriate.

Do not rewrite the research model. Just align labeling and display logic.

**Step 4: Re-run the test**

Run:

```bash
node --test test/research-confidence-copy.test.mjs
```

**Step 5: Lint**

Run:

```bash
npx eslint components/design/research-client.tsx lib/research-types.ts test/research-confidence-copy.test.mjs
```

**Step 6: Commit**

```bash
git add components/design/research-client.tsx lib/research-types.ts test/research-confidence-copy.test.mjs
git commit -m "refactor: align research confidence semantics"
```

---

### Task 8: Final Verification And Cleanup

**Files:**
- Review all changed files from Tasks 1-7

**Step 1: Run focused tests**

Run:

```bash
node --test test/creator-tools-confidence.test.mjs
node --test test/session-validation-metadata.test.mjs
node --test test/drop-evidence-anchor.test.mjs
node --test test/design-guidance-route.test.mjs
node --test test/research-confidence-copy.test.mjs
```

**Step 2: Run lint on changed code**

Run:

```bash
npx eslint app components lib test
```

If full-project lint is too slow, run only on changed files.

**Step 3: Manual verification**

Review in browser:

- `/drops/creator-tools`
- `/drops/creator-tools/prd`
- `/new`
- `/explorations/[id]`
- `/research`
- `/guidance`

Check:

- confidence treatment is understandable
- confirmed vs emerging signal is visually distinct
- guidance is discoverable
- docs match implemented behavior

**Step 4: Final commit**

```bash
git add app components docs lib test
git commit -m "feat: implement carrier v1.1 confidence and guidance foundations"
```
