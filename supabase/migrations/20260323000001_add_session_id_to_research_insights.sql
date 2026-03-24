-- Migration: add session_id column to research_insights
-- Required by use-session-insights.ts and session synthesize routes

alter table research_insights
  add column if not exists session_id uuid references voting_sessions(id) on delete cascade;

create index if not exists idx_research_insights_session on research_insights(session_id);
