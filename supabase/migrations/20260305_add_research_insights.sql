-- Research insights synthesized by Ollama from session data
create table research_insights (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text,
  body text,
  mentions int,
  tags text[],
  source_session_ids uuid[],
  metadata jsonb,
  batch_id uuid not null,
  created_at timestamptz default now()
);

create index idx_research_insights_batch on research_insights(batch_id);
create index idx_research_insights_type on research_insights(type);

-- RLS off — private tool, single user
alter table research_insights enable row level security;

create policy "Insights are publicly readable"
  on research_insights for select using (true);

create policy "Anyone can insert insights"
  on research_insights for insert with check (true);

create policy "Anyone can delete insights"
  on research_insights for delete using (true);
