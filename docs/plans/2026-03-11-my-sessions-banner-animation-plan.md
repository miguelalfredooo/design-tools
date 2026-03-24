# My Sessions Banner Animation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a compact animated banner strip to each session card in the `My Sessions` tab without changing the underlying card layout.

**Architecture:** Reuse the existing `My Sessions` feed on `app/page.tsx`, introduce a small banner-strip component dedicated to the session card context, and keep the animation treatment lightweight. Use a file-contract test first to lock the render path and then implement the component with minimal motion dependencies.

**Tech Stack:** Next.js, React, Motion, Tailwind, node:test

---

### Task 1: Lock the render path with a failing test

**Files:**
- Create: `test/my-sessions-banner-animation.test.mjs`
- Read: `app/page.tsx`
- Read: `components/design/session-card.tsx`

**Step 1: Write the failing test**

Assert that:
- `app/page.tsx` renders a dedicated banner-strip component in the `My Sessions` path
- the session card path contains banner copy and animation hooks

**Step 2: Run test to verify it fails**

Run: `node --test test/my-sessions-banner-animation.test.mjs`

### Task 2: Add the banner strip component

**Files:**
- Create: `components/design/session-card-banner.tsx`

**Step 1: Write minimal implementation**

Build a small banner strip that:
- matches the existing card tone
- includes concise copy
- uses a one-time subtle animation

**Step 2: Run the test to verify partial progress**

Run: `node --test test/my-sessions-banner-animation.test.mjs`

### Task 3: Wire the banner strip into My Sessions only

**Files:**
- Modify: `app/page.tsx`

**Step 1: Integrate the new component into the `My Sessions` branch only**

Do not change `All Sessions`.

**Step 2: Run the test to verify it passes**

Run: `node --test test/my-sessions-banner-animation.test.mjs`

### Task 4: Verify

**Files:**
- Test: `test/my-sessions-banner-animation.test.mjs`

**Step 1: Run targeted verification**

Run:
- `node --test test/my-sessions-banner-animation.test.mjs`
- `npx eslint app/page.tsx components/design/session-card-banner.tsx test/my-sessions-banner-animation.test.mjs`
