# Carrier Supabase Setup

Carrier uses a work-owned Supabase project: `bwuqbcleoatmtyppaqzm`

## Environment Variables

| Variable | Where used |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts` — client-side reads |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase.ts` — client-side reads |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase-server.ts` — server API routes |

## Linking and applying migrations

```bash
supabase login
supabase link --project-ref bwuqbcleoatmtyppaqzm
supabase db push
```

## Schema source of truth

`supabase/migrations/` — apply in order. This is the operational source of truth.

If the live project and repo ever drift, run `supabase db push` to re-align.

## Current migration inventory

| File | Covers |
|---|---|
| `20260101000000_base_schema.sql` | Base tables: voting_sessions, voting_options, voting_votes, design_comments, reactions |
| `20260302000000_add_stakeholder_context.sql` | Stakeholder context fields on sessions |
| `20260302000001_move_effort_impact_to_votes.sql` | Effort/impact columns on votes |
| `20260303000000_add_excalidraw_media_type.sql` | Excalidraw media type support |
| `20260303000001_add_design_comments.sql` | Design comments table |
| `20260305000000_add_research_insights.sql` | research_insights table |
| `20260305000001_add_research_hub.sql` | research_observations, research_segments, research_segment_items, research_share_tokens |
| `20260323000000_add_carrier_notifications.sql` | carrier_notifications table |
| `20260323000001_add_session_id_to_research_insights.sql` | session_id column on research_insights |

## What depends on Supabase

- Sessions, votes, options, comments, reactions — core voting flow
- Realtime updates — voting and session status
- Research observations, segments, segment items — Insights hub
- Research insights — Overview synthesis results
- Notifications — carrier_notifications table

## Synthesis provider

Carrier uses **Anthropic** as the primary synthesis provider via `lib/synthesis-llm.ts`.

Required env:
```
SYNTHESIS_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
ANTHROPIC_SYNTHESIS_MODEL=claude-haiku-4-5-20251001
```

OpenAI is supported as a fallback by setting `SYNTHESIS_PROVIDER=openai` and providing:
```
OPENAI_API_KEY=...
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_SYNTHESIS_MODEL=gpt-5.1-chat-latest
```

Crew service (Design Ops agents) in `crew/.env` uses its own config independently.
