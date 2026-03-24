-- Standalone comments on design options (independent of votes)
create table design_comments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references voting_sessions(id) on delete cascade,
  option_id uuid not null references voting_options(id) on delete cascade,
  voter_id text not null,
  voter_name text not null,
  body text not null,
  created_at timestamptz default now()
);

create index idx_design_comments_session on design_comments(session_id);
create index idx_design_comments_option on design_comments(option_id);

-- RLS
alter table design_comments enable row level security;

-- Anyone can read comments
create policy "Comments are publicly readable"
  on design_comments for select using (true);

-- Anyone can insert comments
create policy "Anyone can insert a comment"
  on design_comments for insert with check (true);

-- Enable realtime
alter publication supabase_realtime add table design_comments;
