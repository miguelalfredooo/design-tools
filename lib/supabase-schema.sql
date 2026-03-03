-- Shareable Design Voting Sessions — Supabase Schema
-- Run this in the Supabase SQL Editor to create tables, indexes, and RLS policies.

-- Sessions
create table voting_sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  preview_url text,
  phase text not null default 'setup' check (phase in ('setup', 'voting', 'revealed')),
  participant_count int not null default 1 check (participant_count >= 1),
  creator_token text not null,
  created_at timestamptz default now()
);

-- Options
create table voting_options (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references voting_sessions(id) on delete cascade,
  title text not null,
  description text default '',
  media_type text default 'none' check (media_type in ('none', 'image', 'figma-embed', 'excalidraw')),
  media_url text,
  position int not null default 0,
  created_at timestamptz default now()
);

-- Votes (unique per voter per session)
create table voting_votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references voting_sessions(id) on delete cascade,
  option_id uuid not null references voting_options(id) on delete cascade,
  voter_id text not null,
  voter_name text not null,
  comment text,
  created_at timestamptz default now(),
  unique (session_id, voter_id)
);

-- Indexes
create index idx_voting_options_session on voting_options(session_id);
create index idx_voting_votes_session on voting_votes(session_id);

-- RLS
alter table voting_sessions enable row level security;
alter table voting_options enable row level security;
alter table voting_votes enable row level security;

-- Public read for sessions and options (anyone with the link can see)
create policy "Sessions are publicly readable"
  on voting_sessions for select using (true);
create policy "Options are publicly readable"
  on voting_options for select using (true);

-- Votes: anyone can insert, readable only when session is revealed
create policy "Anyone can insert a vote"
  on voting_votes for insert with check (true);
create policy "Votes readable when session revealed"
  on voting_votes for select using (
    exists (
      select 1 from voting_sessions
      where id = voting_votes.session_id and phase = 'revealed'
    )
  );

-- Vote count is always readable (for progress bar) via a function
create or replace function get_vote_count(p_session_id uuid)
returns int
language sql
security definer
as $$
  select count(*)::int from voting_votes where session_id = p_session_id;
$$;

-- Enable realtime for votes table (for live progress updates)
alter publication supabase_realtime add table voting_votes;
alter publication supabase_realtime add table voting_sessions;
