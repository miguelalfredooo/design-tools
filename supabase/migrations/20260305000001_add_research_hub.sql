-- Migration: add research hub tables
-- Covers: research_observations, research_segments, research_segment_items, research_share_tokens

create table research_observations (
  id          uuid primary key default gen_random_uuid(),
  body        text not null,
  area        text not null,
  contributor text,
  source_url  text,
  created_at  timestamptz not null default now()
);

create index idx_research_observations_area on research_observations(area);
create index idx_research_observations_created on research_observations(created_at desc);

alter table research_observations enable row level security;
create policy "Observations are publicly readable" on research_observations for select using (true);
create policy "Anyone can insert observations"     on research_observations for insert with check (true);
create policy "Anyone can delete observations"     on research_observations for delete using (true);


create table research_segments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

alter table research_segments enable row level security;
create policy "Segments are publicly readable" on research_segments for select using (true);
create policy "Anyone can insert segments"     on research_segments for insert with check (true);
create policy "Anyone can delete segments"     on research_segments for delete using (true);


create table research_segment_items (
  id                     uuid primary key default gen_random_uuid(),
  segment_id             uuid not null references research_segments(id) on delete cascade,
  bucket                 text not null check (bucket in ('needs', 'pain_points', 'opportunities', 'actionable_insights')),
  title                  text not null,
  body                   text,
  source_observation_ids uuid[],
  batch_id               uuid,
  created_at             timestamptz not null default now()
);

create index idx_research_segment_items_segment on research_segment_items(segment_id);
create index idx_research_segment_items_batch   on research_segment_items(batch_id);

alter table research_segment_items enable row level security;
create policy "Segment items are publicly readable" on research_segment_items for select using (true);
create policy "Anyone can insert segment items"     on research_segment_items for insert with check (true);
create policy "Anyone can delete segment items"     on research_segment_items for delete using (true);


create table research_share_tokens (
  id         uuid primary key default gen_random_uuid(),
  token      text not null unique,
  created_by text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_research_share_tokens_token on research_share_tokens(token);

alter table research_share_tokens enable row level security;
create policy "Tokens are publicly readable" on research_share_tokens for select using (true);
create policy "Anyone can insert tokens"     on research_share_tokens for insert with check (true);
create policy "Anyone can delete tokens"     on research_share_tokens for delete using (true);
