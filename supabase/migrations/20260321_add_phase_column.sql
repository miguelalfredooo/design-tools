-- Add phase column to voting_sessions
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS phase TEXT DEFAULT 'setup';

-- Phase can be: setup, voting, revealed
CREATE INDEX IF NOT EXISTS idx_voting_sessions_phase ON voting_sessions(phase);
