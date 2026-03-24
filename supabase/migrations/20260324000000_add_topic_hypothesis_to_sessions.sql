-- Add topic and hypothesis fields to voting_sessions
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS topic text;
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS hypothesis text;
