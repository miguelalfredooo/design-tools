-- Add session-level brief fields
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS problem text;
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS goal text;
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS audience text;
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS constraints text;

-- Add per-option annotation fields
ALTER TABLE voting_options ADD COLUMN IF NOT EXISTS rationale text;
ALTER TABLE voting_options ADD COLUMN IF NOT EXISTS effort text;
ALTER TABLE voting_options ADD COLUMN IF NOT EXISTS impact text;
