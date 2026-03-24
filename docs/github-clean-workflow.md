---
name: github-clean-workflow
description: >
  Use this skill for any GitHub or git task — pushing to main, merging branches, committing changes,
  resolving conflicts, or checking repo state. Trigger whenever the user mentions git, GitHub, push,
  pull, merge, commit, branch, or conflict. Essential for preventing the "uncommitted changes on merge"
  problem where local and remote get out of sync. Always use this skill before giving git commands or
  workflow advice, even for simple one-liners.
---

# GitHub Clean Workflow Skill

## Core Problem This Prevents
Local branches diverging from remote. Uncommitted changes blocking push/merge. Thinking something
was pushed when it wasn't. Use these habits every session.

---

## The Golden Rule
**Never assume your local state matches remote.** Always verify before pushing or merging.

---

## Session Start Checklist
Run this before doing ANY work:

```bash
git status                  # Are there uncommitted changes?
git fetch origin            # Pull remote metadata (doesn't change local files)
git log --oneline -5        # Where is local HEAD?
git log --oneline origin/main -5   # Where is remote main?
```

If local and remote HEAD differ → sync before anything else (see Sync section below).

---

## Before Every Push

```bash
# 1. Stage everything intentionally
git add -A                  # or: git add <specific files>

# 2. Verify what you're about to commit
git diff --staged           # See exactly what's staged

# 3. Commit with a clear message
git commit -m "verb: what changed and why"

# 4. Fetch remote state before pushing
git fetch origin

# 5. Check if remote has moved ahead
git log HEAD..origin/main --oneline    # If output = empty, you're safe to push

# 6. Push
git push origin main        # or your branch name
```

**If step 5 shows commits you don't have locally → rebase first (see below).**

---

## Before Every Merge (PR or local)

```bash
git fetch origin
git status                  # Must be clean — no uncommitted changes
git diff origin/main        # See what's different between your branch and main
```

If `git status` shows anything → commit or stash it before merging.

```bash
git stash           # Temporarily shelve uncommitted work
# ... do the merge ...
git stash pop       # Restore your work after
```

---

## Syncing When Behind Remote

```bash
# Option A: Rebase (cleaner history, preferred for feature branches)
git pull --rebase origin main

# Option B: Merge (creates a merge commit)
git pull origin main
```

Use **rebase** when working on a feature branch solo.
Use **merge** when multiple people share a branch.

---

## Conflict Resolution Flow

```bash
git status                  # Shows files with conflicts
# Open conflicted files, resolve manually (look for <<<<<<< markers)
git add <resolved-file>
git rebase --continue       # if mid-rebase
# or
git merge --continue        # if mid-merge
```

To abort and start over:
```bash
git rebase --abort
# or
git merge --abort
```

---

## Common Failure Patterns (and fixes)

| Symptom | Likely Cause | Fix |
|---|---|---|
| Push rejected | Remote has commits you don't | `git pull --rebase origin main` then push |
| "Merge conflict" on PR | Branch diverged from main | `git fetch && git rebase origin/main` on your branch |
| Changes not showing up after push | Forgot to commit before pushing | `git status` → commit → push |
| "Nothing to commit" but changes exist | Working in wrong directory | `pwd` → check you're in the right repo |
| Detached HEAD | Checked out a commit not a branch | `git checkout main` |

---

## Aliases Worth Setting (one-time setup)

```bash
git config --global alias.st "status"
git config --global alias.lg "log --oneline --graph --decorate -10"
git config --global alias.sync "!git fetch origin && git rebase origin/main"
```

Then `git sync` becomes your pre-work habit.

---

## Working on Main vs. Branches

**If you're committing directly to main (small projects / solo work):**
- Always `git fetch && git status` before starting
- Commit small and often — don't let local diverge
- Push after every logical unit of work

**If you're using branches:**
- Keep branches short-lived (days, not weeks)
- Rebase onto main regularly: `git sync` (alias above)
- Delete merged branches: `git branch -d branch-name`

---

## Quick Reference Card

```
Before working:   git fetch origin && git status
Before pushing:   git add -A && git diff --staged && git commit -m "..."
Before merging:   git status (must be clean) && git fetch origin
Stuck/confused:   git status → git log --oneline -5 → git fetch
```
