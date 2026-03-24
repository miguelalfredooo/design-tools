# Creator Tools Section Feedback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add reusable section-level stakeholder feedback to creator tools using quick reactions plus optional notes, with anonymous-feeling UI and admin-visible author metadata.

**Architecture:** Introduce a reusable `SectionFeedback` component and a creator-tools feedback data model scoped to page sections and cards rather than exploration options. Keep the first pass minimal: section-level feedback on creator-tools pages only, using explicit reaction types and inline notes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, existing local identity handling, creator-tools mock pages, Supabase-backed API patterns

---

### Task 1: Define creator-tools feedback types

**Files:**
- Create: `lib/creator-tools-feedback-types.ts`

**Step 1: Add domain types**

Define:

- `CreatorToolsFeedbackReactionType`
- `CreatorToolsFeedbackTargetType`
- `CreatorToolsFeedbackTarget`
- `CreatorToolsFeedbackReaction`
- `CreatorToolsFeedbackNote`
- `CreatorToolsFeedbackSummary`

Reaction types:

- `working`
- `unclear`
- `not_useful`
- `promising`

**Step 2: Add helper constants**

Add display metadata for reaction labels and visual treatment.

**Step 3: Run lint**

Run: `npx eslint lib/creator-tools-feedback-types.ts`

**Step 4: Commit**

```bash
git add lib/creator-tools-feedback-types.ts
git commit -m "feat: add creator tools feedback domain types"
```

### Task 2: Create the reusable SectionFeedback component

**Files:**
- Create: `components/design/section-feedback.tsx`

**Step 1: Build the compact reaction row**

Render fixed reaction chips with:

- selected state
- aggregate count
- accessible labels

**Step 2: Add optional inline note flow**

Behavior:

- `Add note` reveals inline textarea/input
- note is optional
- submit remains scoped to the current target

**Step 3: Keep authorship hidden**

Do not render author names in the component UI.

**Step 4: Keep layout lightweight**

The component should fit inside cards and section footers without dominating the page.

**Step 5: Run lint**

Run: `npx eslint components/design/section-feedback.tsx`

**Step 6: Commit**

```bash
git add components/design/section-feedback.tsx
git commit -m "feat: add reusable section feedback component"
```

### Task 3: Add a local/mock data path for creator-tools feedback

**Files:**
- Create: `lib/mock/creator-tools-feedback.ts`
- Optionally create: `hooks/use-creator-tools-feedback.ts`

**Step 1: Define prototype targets**

Map target ids for:

- overview findings
- overview opportunity block
- themes
- audience segments
- thread cards
- action cards

**Step 2: Add mock summaries**

Seed reaction counts and optional notes for prototype testing.

**Step 3: Add simple state update path**

For the first pass, allow in-memory or local-state updates if backend work is deferred.

**Step 4: Run lint**

Run: `npx eslint lib/mock/creator-tools-feedback.ts hooks/use-creator-tools-feedback.ts`

**Step 5: Commit**

```bash
git add lib/mock/creator-tools-feedback.ts hooks/use-creator-tools-feedback.ts
git commit -m "feat: add creator tools feedback mock state"
```

### Task 4: Add feedback to Overview

**Files:**
- Modify: `app/drops/creator-tools/page.tsx`

**Step 1: Attach feedback to overview findings**

Place `SectionFeedback` on:

- each finding card
- primary opportunity block
- supporting conversations block

**Step 2: Keep hierarchy intact**

Feedback should sit beneath card content or in a footer area, not compete with the primary insight copy.

**Step 3: Run lint**

Run: `npx eslint app/drops/creator-tools/page.tsx`

**Step 4: Commit**

```bash
git add app/drops/creator-tools/page.tsx
git commit -m "feat: add section feedback to creator tools overview"
```

### Task 5: Add feedback to Themes and Audience

**Files:**
- Modify: `app/drops/creator-tools/themes/page.tsx`
- Modify: `app/drops/creator-tools/audience/page.tsx`

**Step 1: Add feedback to each theme tile**

Each theme card gets scoped feedback.

**Step 2: Add feedback to each audience segment card**

Each audience card gets scoped feedback.

**Step 3: Run lint**

Run: `npx eslint app/drops/creator-tools/themes/page.tsx app/drops/creator-tools/audience/page.tsx`

**Step 4: Commit**

```bash
git add app/drops/creator-tools/themes/page.tsx app/drops/creator-tools/audience/page.tsx
git commit -m "feat: add section feedback to themes and audience"
```

### Task 6: Add feedback to Threads and Actions

**Files:**
- Modify: `app/drops/creator-tools/threads/page.tsx`
- Modify: `app/drops/creator-tools/actions/page.tsx`

**Step 1: Add feedback to thread evidence cards**

Apply to:

- breakout conversation cards
- leading thread cards

**Step 2: Add feedback to action cards**

Apply to:

- prioritized action cards
- response opportunity cards

**Step 3: Run lint**

Run: `npx eslint app/drops/creator-tools/threads/page.tsx app/drops/creator-tools/actions/page.tsx`

**Step 4: Commit**

```bash
git add app/drops/creator-tools/threads/page.tsx app/drops/creator-tools/actions/page.tsx
git commit -m "feat: add section feedback to threads and actions"
```

### Task 7: Add admin-visible feedback metadata path

**Files:**
- Create or modify: backend/API files as needed
- Create or modify: admin review surface if included in scope

**Step 1: Persist author metadata**

Ensure stored feedback includes:

- voter id
- voter name
- target
- reaction
- note
- timestamps

**Step 2: Keep public UI anonymous**

Do not expose author names in creator-tools cards.

**Step 3: If admin review is in scope, add a simple inspection surface**

Keep it minimal and admin-only.

**Step 4: Run lint/tests**

Run project-appropriate verification.

**Step 5: Commit**

```bash
git add <relevant files>
git commit -m "feat: store attributable creator tools feedback for admin review"
```

### Task 8: Verify full creator-tools feedback flow

**Files:**
- Verify all touched files

**Step 1: Run lint**

Run: `npx eslint .`

Expected: no ESLint errors

**Step 2: Run local dev server**

Run: `npm run dev`

Check:

- reactions are lightweight and easy to scan
- notes are optional and inline
- names are not exposed in stakeholder-facing UI
- feedback remains scoped to the card/section it belongs to

**Step 3: Commit final integration**

```bash
git add app/drops/creator-tools components/design lib/mock hooks
git commit -m "feat: add lightweight stakeholder feedback to creator tools"
```
