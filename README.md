# Carrier

Carrier is a private, desktop-only product-design workspace for running research sessions, synthesizing insights, and reviewing Design Ops outputs in one place.

## Local Development

```bash
cd /Users/miguelarias/cafemedia/design/carrier
npm run dev
```

Runs at **http://localhost:3500**

Key routes:

| Route | Description |
|---|---|
| `/` | Sessions — create, vote, reveal results |
| `/research` | Insights hub — overview, observations, segments, replays, reference |
| `/design-ops` | Design Ops workspace |
| `/drops/creator-tools` | Creator Tools project drop |

---

## Environment Variables

All keys live in `.env.local`. Global keys are auto-sourced from `~/.env.global` via `~/.zshrc`.

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client-side Supabase reads |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side Supabase reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Server API routes — writes and privileged reads |
| `DESIGN_TOOLS_PASSWORD` | Admin override flows |
| `ANTHROPIC_API_KEY` | Research synthesis (Haiku), Slack sync |
| `ANTHROPIC_SYNTHESIS_MODEL` | Model override — default `claude-haiku-4-5-20251001` |
| `OPENAI_API_KEY` | Optional fallback synthesis provider |
| `OPENAI_API_BASE` | OpenAI base URL |
| `OPENAI_SYNTHESIS_MODEL` | OpenAI model name if provider is set to openai |
| `SYNTHESIS_PROVIDER` | `anthropic` or `openai` — controls which LLM synthesis uses |
| `SLACK_BOT_TOKEN` | Slack channel sync script (optional) |

Synthesis provider is controlled by `SYNTHESIS_PROVIDER`. Default and recommended: `anthropic`.

---

## Supabase

Carrier uses a work-owned Supabase project (`bwuqbcleoatmtyppaqzm`).

Apply migrations:

```bash
supabase link --project-ref bwuqbcleoatmtyppaqzm
supabase db push
```

Schema source of truth: `supabase/migrations/`

See `docs/supabase-setup.md` for full details.

---

## Insights — Research Hub

The `/research` route is the full research hub. Navigation is in the sidebar — clicking Insights collapses the main nav and shows a sub-nav with:

- **Overview** — live dashboard: observation counts, segment summaries, top findings, area breakdown
- **Observations** — log and synthesize raw UX observations
- **Segments** — user segments with synthesized needs, pain points, opportunities, and actionable insights
- **Replays** — session replay notes
- **Reference** — live summary of all research data: stats, area breakdown, activity timeline, contributor voices

### Synthesis flow

1. Log observations under Observations (manually or via Slack sync)
2. Select observations → Synthesize → Haiku extracts structured insights into segments
3. Each synthesis run **replaces** existing items for affected segments (no accumulation)
4. Overview and Reference update automatically from live data

### Slack sync

Pull user feedback from a Slack channel into observations:

```bash
# Dry run — preview what would be extracted
npm run slack:sync -- --channel feedback --days 7 --dry-run

# Live run
npm run slack:sync -- --channel feedback --days 7
```

Requires `SLACK_BOT_TOKEN` in `.env.local`. See `scripts/slack-sync.mjs` for full docs.

---

## Git Workflow

Carrier develops directly on `main` — no feature branches, no worktrees.

```bash
git fetch origin && git status
# make changes
git add <files>
git commit -m "type(scope): description"
git log HEAD..origin/carrier-prd-v1-1 --oneline   # rebase if not empty
git push origin main
```

Remote tracking branch: `origin/carrier-prd-v1-1`

Always read `docs/github-clean-workflow.md` before any git/GitHub task.
