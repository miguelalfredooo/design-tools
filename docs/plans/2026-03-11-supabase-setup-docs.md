# Carrier Supabase Setup Docs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Document Carrier's current Supabase dependency so the repo is reproducible without switching away from the existing backend project.

**Architecture:** Keep runtime behavior unchanged. Add a small set of docs and a checked-in environment template that explain which environment variables are required, which app features depend on Supabase, and how the existing migrations map to the live backend. If the audit exposes a real mismatch, document it rather than attempting a backend migration in this pass.

**Tech Stack:** Next.js, Supabase, Markdown docs, env template

---

### Task 1: Audit the current backend touchpoints

**Files:**
- Read: `lib/supabase.ts`
- Read: `lib/supabase-server.ts`
- Read: `app/api/design/**`
- Read: `supabase/migrations/*`

**Step 1: Confirm the required environment variables**

Check which variables are read by client and server code.

**Step 2: Identify feature areas backed by Supabase**

List the flows that fail or degrade without Supabase.

**Step 3: Verify the repo contains migrations for the current feature set**

Note any obvious schema gap rather than trying to fix it in this task.

### Task 2: Add a checked-in env template

**Files:**
- Create: `.env.example`

**Step 1: Write the failing doc test**

Add a file-contract test asserting `.env.example` includes the required variables.

**Step 2: Run test to verify it fails**

Run: `node --test test/supabase-setup-docs.test.mjs`

**Step 3: Write minimal implementation**

Add placeholders for:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DESIGN_TOOLS_PASSWORD`

**Step 4: Run test to verify it passes**

Run: `node --test test/supabase-setup-docs.test.mjs`

### Task 3: Replace the boilerplate README with repo-specific setup guidance

**Files:**
- Modify: `README.md`

**Step 1: Extend the failing doc test**

Assert the README references Carrier dev URLs, env setup, and the current decision to stay on the existing Supabase project.

**Step 2: Run test to verify it fails**

Run: `node --test test/supabase-setup-docs.test.mjs`

**Step 3: Write minimal implementation**

Document:
- local dev commands
- required env vars
- current canonical localhost URLs
- note that Carrier remains on the existing Supabase project for now

**Step 4: Run test to verify it passes**

Run: `node --test test/supabase-setup-docs.test.mjs`

### Task 4: Add a focused backend setup note

**Files:**
- Create: `docs/supabase-setup.md`

**Step 1: Extend the failing doc test**

Assert the new doc covers required variables, feature dependencies, migration location, and future migration guidance.

**Step 2: Run test to verify it fails**

Run: `node --test test/supabase-setup-docs.test.mjs`

**Step 3: Write minimal implementation**

Capture:
- backend ownership decision for now
- Supabase-backed feature inventory
- migration folder location
- suggested later migration path to a work-owned project

**Step 4: Run test to verify it passes**

Run: `node --test test/supabase-setup-docs.test.mjs`

### Task 5: Verify and summarize

**Files:**
- Test: `test/supabase-setup-docs.test.mjs`

**Step 1: Run targeted verification**

Run:
- `node --test test/supabase-setup-docs.test.mjs`
- `npx eslint README.md docs/supabase-setup.md test/supabase-setup-docs.test.mjs`

**Step 2: Confirm no runtime code changed unexpectedly**

Run: `git diff --stat`

**Step 3: Commit**

```bash
git add .env.example README.md docs/supabase-setup.md test/supabase-setup-docs.test.mjs docs/plans/2026-03-11-supabase-setup-docs.md
git commit -m "docs: add carrier supabase setup guide"
```
