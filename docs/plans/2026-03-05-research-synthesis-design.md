# Research Synthesis with Ollama

## Overview

Replace mock data on `/research` with real synthesized insights. Ollama (local LLM) processes session data from Supabase — votes, comments, feedback — and produces structured research output. Private tool, single user.

## Architecture: API Route + Ollama (On-Demand)

User clicks "Synthesize" on `/research` page. Next.js API route fetches all session data from Supabase, sends it to Ollama, writes structured results back to Supabase. Page reads latest batch.

```
[/research page] --click--> [/api/research/synthesize]
                                  |
                                  +--> Supabase: read sessions/votes/comments
                                  +--> Ollama (localhost:11434): llama3.2
                                  +--> Supabase: write research_insights rows
                                  |
[/research page] <--reload-- [done]
```

## Data Model

### New table: `research_insights`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid (PK, default gen_random_uuid()) | |
| `type` | text NOT NULL | `theme`, `opportunity`, `consensus`, `tension`, `open_question`, `signal`, `one_metric` |
| `title` | text | Theme name, HMW question, signal title, metric name |
| `body` | text | Summary, detail, rationale |
| `mentions` | int | Count for themes |
| `tags` | text[] | Extracted tags |
| `source_session_ids` | uuid[] | Which sessions contributed |
| `metadata` | jsonb | Flexible (confidence level, related theme, voter info) |
| `batch_id` | uuid NOT NULL | Groups all insights from one synthesis run |
| `created_at` | timestamptz DEFAULT now() | |

Each synthesis run creates a new `batch_id`. Page reads latest batch. Old batches preserved for history.

## Synthesis Pipeline

### Step 1: Gather data

Fetch from Supabase:
- `voting_sessions` (title, description, problem, goal, audience, constraints)
- `voting_votes` (option chosen, comment, effort, impact, voter name)
- `design_comments` (body, voter name, option context)
- `voting_options` (title, description, rationale — for context)

### Step 2: Build prompt

```
You are a synthesis analyst helping a product designer extract strategic insights from design exploration sessions.

Below is raw data from {n} design sessions including vote comments, feedback, and session context.

--- RAW DATA ---
{formatted sessions with votes/comments}
--- END DATA ---

Analyze this content and respond with valid JSON in this exact structure:

{
  "themes": [
    {
      "title": "Short descriptive name",
      "summary": "What the data is saying",
      "sources": ["Session: X - voter Y said...", ...],
      "mentions": <number>,
      "confidence": "validated" | "assumed" | "speculative"
    }
  ],
  "opportunities": [
    {
      "theme": "Theme title it relates to",
      "hmw": "How might we...",
      "confidence": "validated" | "assumed" | "speculative"
    }
  ],
  "consensus": ["Where multiple sources agree..."],
  "tensions": ["Where sources contradict..."],
  "open_questions": ["What the data leaves unanswered..."],
  "signals": [
    {
      "title": "Surprising finding",
      "detail": "Why it matters"
    }
  ],
  "one_metric": {
    "metric": "The single behavior/outcome to improve",
    "rationale": "Why this has the highest downstream impact"
  }
}

Rules:
- Ground synthesis in what the data actually says
- Flag inferences vs. direct findings explicitly
- Use plain language suitable for stakeholder briefs
- Never fabricate supporting evidence - if something is thin, say so
- Return ONLY valid JSON, no markdown wrapping
```

### Step 3: Call Ollama

`POST http://localhost:11434/api/generate` with model `llama3.2`, `stream: false`.

### Step 4: Parse and store

Parse JSON response. Write rows to `research_insights` grouped by `batch_id`:

| JSON field | type column | Mapping |
|-----------|-------------|---------|
| `themes[i]` | `theme` | title, summary->body, mentions, confidence->metadata |
| `opportunities[i]` | `opportunity` | hmw->title, confidence->metadata, theme->metadata |
| `consensus[i]` | `consensus` | text->body |
| `tensions[i]` | `tension` | text->body |
| `open_questions[i]` | `open_question` | text->body |
| `signals[i]` | `signal` | title, detail->body |
| `one_metric` | `one_metric` | metric->title, rationale->body |

## Updated Research Page UI

### Left column (sticky sidebar)
- Overview stats: theme count, opportunity count, session count, signal count (computed from latest batch)
- **One Metric That Matters** — prominent callout card
- **Signals Worth Watching** — replaces old activity timeline

### Right column (scrollable)
- **Emerging Themes** — bar chart with confidence badges (validated/assumed/speculative)
- **Opportunities** — "How Might We" questions grouped by related theme
- **Consensus vs. Tension Map** — consensus items, tension items, open questions
- **Community Voices** — direct voter quotes from comments that Ollama referenced as sources

### Top bar
- "Synthesize" button with loading state
- Model name and last synthesis timestamp
- Empty state when no synthesis has been run yet

## Files to create/modify

### New files
- `supabase/migrations/2026XXXX_add_research_insights.sql` — create table
- `app/api/research/synthesize/route.ts` — synthesis API route
- `lib/research-types.ts` — types for insights
- `lib/ollama.ts` — Ollama client helper

### Modified files
- `app/research/page.tsx` — replace mock data with Supabase reads + new UI sections

## Model choice

Default: `llama3.2` (2GB, fast, good for structured extraction). Can be swapped via env var `OLLAMA_MODEL` for flexibility.
