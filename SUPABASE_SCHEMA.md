# Supabase Schema — Database Reference

Complete Carrier database schema. All tables have RLS enabled. Public read/write (internal tool).

---

## Voting System

### voting_sessions
Design voting session containers.

```sql
CREATE TABLE voting_sessions (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  problem TEXT,              -- Problem statement for context
  goal TEXT,                 -- Design goal
  audience TEXT,             -- User segment
  constraints TEXT,          -- Constraints
  participant_count INTEGER, -- Expected voters
  creator_token TEXT,        -- Auth token for creator-only ops
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

INDEXES:
- creator_token (find sessions by creator)
- created_at DESC (recent first)
```

**RLS:** Public read/write

---

### voting_options
Design options within a session.

```sql
CREATE TABLE voting_options (
  id UUID PRIMARY KEY,
  session_id UUID,           -- References voting_sessions
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT,           -- "none" | "image" | "figma-embed" | "excalidraw"
  media_url TEXT,            -- URL to media
  position INTEGER,          -- Display order
  rationale TEXT,            -- Why this option
  effort TEXT,               -- Effort estimate
  impact TEXT,               -- Impact estimate
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

FOREIGN KEY: session_id → voting_sessions(id) ON DELETE CASCADE

INDEXES:
- session_id (find options in session)
- position (sort by display order)
```

---

### voting_votes
Individual votes cast by participants.

```sql
CREATE TABLE voting_votes (
  id UUID PRIMARY KEY,
  option_id UUID,            -- References voting_options
  session_id UUID,           -- References voting_sessions
  voter_token TEXT,          -- Anonymous voter ID
  effort TEXT,               -- Effort rating (from voter)
  impact TEXT,               -- Impact rating (from voter)
  created_at TIMESTAMPTZ
);

FOREIGN KEYS:
- option_id → voting_options(id) ON DELETE CASCADE
- session_id → voting_sessions(id) ON DELETE CASCADE

INDEXES:
- option_id (find votes for option)
- session_id (find votes in session)
- voter_token (find voter's votes)

CONSTRAINT: Unique (session_id, voter_token) — one vote per voter per session
```

---

## Interactions

### voting_reactions
Hearts/likes on options.

```sql
CREATE TABLE voting_reactions (
  id UUID PRIMARY KEY,
  option_id UUID,
  session_id UUID,
  voter_token TEXT,
  created_at TIMESTAMPTZ
);

FOREIGN KEYS: option_id, session_id

INDEXES:
- option_id (count hearts per option)
- session_id (find reactions in session)
- voter_token (find voter's reactions)
```

---

### design_comments
Spatial comments on design images.

```sql
CREATE TABLE design_comments (
  id UUID PRIMARY KEY,
  option_id UUID,
  session_id UUID,
  body TEXT NOT NULL,
  voter_token TEXT,
  voter_name TEXT,
  x_pct FLOAT,               -- 0-100, left position
  y_pct FLOAT,               -- 0-100, top position
  created_at TIMESTAMPTZ
);

FOREIGN KEYS: option_id, session_id

INDEXES:
- option_id (find comments on design)
- session_id (find comments in session)
```

---

## Research System

### research_observations
Raw research notes tagged by area.

```sql
CREATE TABLE research_observations (
  id UUID PRIMARY KEY,
  session_id UUID,
  observation TEXT,
  area TEXT,                 -- e.g., "Checkout", "Onboarding"
  category TEXT,
  body TEXT,
  contributor TEXT,         -- Who contributed
  source_url TEXT,          -- Where this came from
  metadata JSONB,           -- Extra data
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

INDEXES:
- session_id
- category
- area (filter by area)
```

---

### research_segments
User cohorts/personas.

```sql
CREATE TABLE research_segments (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,       -- e.g., "Mobile users", "Power users"
  description TEXT,
  created_at TIMESTAMPTZ
);

INDEXES:
- name
```

---

### research_segment_items
Bucketed findings within segments.

```sql
CREATE TABLE research_segment_items (
  id UUID PRIMARY KEY,
  segment_id UUID,          -- References research_segments
  bucket TEXT NOT NULL,     -- "needs" | "pain_points" | "opportunities" | "actionable_insights"
  title TEXT NOT NULL,
  body TEXT,
  source_observation_ids UUID[],  -- References to observations that informed this
  batch_id UUID,            -- Groups items from same synthesis run
  created_at TIMESTAMPTZ
);

FOREIGN KEY: segment_id → research_segments(id) ON DELETE CASCADE

INDEXES:
- segment_id (find items in segment)
- batch_id (find items from synthesis batch)
```

---

### research_insights
Synthesized findings with confidence.

```sql
CREATE TABLE research_insights (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,       -- "risk" | "opportunity" | "pattern"
  title TEXT,
  body TEXT,
  confidence TEXT,          -- "Known" | "Probable" | "Assumed"
  mentions INTEGER,         -- How many sources mention this
  tags TEXT[],
  source_session_ids UUID[],
  metadata JSONB,
  batch_id UUID,            -- Synthesis batch
  session_id UUID,          -- Associated session
  created_at TIMESTAMPTZ
);

INDEXES:
- batch_id (find insights from batch)
- type (filter by type)
- session_id (find insights for session)
```

---

## Admin

### research_share_tokens
Public tokens for observation submission.

```sql
CREATE TABLE research_share_tokens (
  id UUID PRIMARY KEY,
  token TEXT UNIQUE,
  created_by TEXT,
  expires_at TIMESTAMPTZ,   -- When token expires
  created_at TIMESTAMPTZ
);

INDEXES:
- token (look up by token)
```

---

### gallery_comments
Integration with nooooowhere gallery.

```sql
CREATE TABLE gallery_comments (
  id UUID PRIMARY KEY,
  item_id UUID,             -- Gallery item
  comment TEXT,
  agent_meta JSONB,         -- Agent metadata
  created_at TIMESTAMPTZ
);

INDEXES:
- item_id
```

---

## Realtime Subscriptions

Enabled on:
- `voting_votes` — Live vote count updates during voting phase
- `voting_sessions` — Session phase changes
- `design_comments` — New comments on designs
- `voting_reactions` — Live heart count

**Usage (JavaScript):**
```javascript
const subscription = supabase
  .channel('votes')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'voting_votes'
  }, (payload) => {
    console.log('New vote:', payload.new);
  })
  .subscribe();
```

---

## Row Level Security

All tables have RLS enabled. Current policies:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| voting_sessions | Public | Public | Public | Creator only* |
| voting_options | Public | Public | Creator | Creator |
| voting_votes | Public (if revealed) | Public | Public | Public |
| research_observations | Public | Public | Public | Public |
| research_segments | Public | Public | Public | Public |
| research_insights | Public | Public | Public | Public |

*Creator verified via `creator_token` in request

---

## Data Integrity

### Foreign Key Cascades
All child tables cascade DELETE to parent:
- Options → deleted when session deleted
- Votes → deleted when option/session deleted
- Comments → deleted when option/session deleted
- Segment items → deleted when segment deleted

### Constraints
- One vote per voter per session (unique constraint on session_id + voter_token)
- Vote only possible if voting_sessions.phase = "voting"

---

## Backup & Recovery

**Backups:** Supabase handles automatic backups (daily, 30-day retention)

**Point-in-time recovery:** Available via Supabase dashboard

**Manual export:**
```bash
# Export as SQL
pg_dump postgresql://user:pass@project.supabase.co/postgres > backup.sql

# Export as JSON
supabase db pull  # Requires Supabase CLI
```

---

## Adding a New Table

1. Create migration: `supabase migration new table_name`
2. Write CREATE TABLE + indexes + RLS
3. Add to migrations folder
4. Run: `supabase migration up`
5. Update this doc

**Template:**
```sql
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parent_table(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_new_table_parent ON new_table(parent_id);

ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "new_table_readable" ON new_table FOR SELECT USING (true);
CREATE POLICY "new_table_insertable" ON new_table FOR INSERT WITH CHECK (true);
```

---

## See Also

- [API_REFERENCE.md](./API_REFERENCE.md) — All endpoints that interact with these tables
- [README.md](./README.md) — Architecture overview
- [CREW_HANDOFF_SPEC.md](./CREW_HANDOFF_SPEC.md) — Data sources that research agent can access
- [docs/README.md](./docs/README.md) — Documentation index
- Supabase dashboard: https://app.supabase.com

