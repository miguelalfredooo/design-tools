# Shared Session Tiles Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the Sessions index so both `My Sessions` and `All Sessions` use the same session tile/grid components instead of rendering nested option feeds.

**Architecture:** Promote `SessionCard` to the shared modular tile for both tabs, compose the banner strip inside the card, and simplify `app/page.tsx` so it only selects which sessions to show and which tab is active. Remove option-feed rendering from the index page entirely; keep option details in the session routes where they already belong.

**Tech Stack:** Next.js, React, Motion, Tailwind, node:test

---

### Task 1: Lock the new page structure with a failing test

**Files:**
- Modify: `test/my-sessions-banner-animation.test.mjs`
- Read: `app/page.tsx`

**Step 1: Write the failing test**

Assert that:
- `app/page.tsx` renders `SessionCard`
- `app/page.tsx` no longer renders `FeedOptionPost`
- both tabs share the same tile path

**Step 2: Run test to verify it fails**

Run: `node --test test/my-sessions-banner-animation.test.mjs`

### Task 2: Make SessionCard the shared modular tile

**Files:**
- Modify: `components/design/session-card.tsx`
- Read: `components/design/session-card-banner.tsx`

**Step 1: Add the banner strip inside the shared card**

Let the card accept scope/ownership props instead of making the page compose separate card pieces.

**Step 2: Keep delete action conditional**

Only show management affordances when appropriate.

### Task 3: Replace the feed renderer on the Sessions page

**Files:**
- Modify: `app/page.tsx`

**Step 1: Remove option-feed rendering**

Delete the nested `FeedOptionPost` list from the sessions index.

**Step 2: Render a shared tile grid**

Use the same `SessionCard` component for both tabs.

**Step 3: Run the test to verify it passes**

Run: `node --test test/my-sessions-banner-animation.test.mjs`

### Task 4: Verify

**Files:**
- Test: `test/my-sessions-banner-animation.test.mjs`

**Step 1: Run targeted verification**

Run:
- `node --test test/my-sessions-banner-animation.test.mjs`
- `npx eslint app/page.tsx components/design/session-card.tsx components/design/session-card-banner.tsx test/my-sessions-banner-animation.test.mjs`
