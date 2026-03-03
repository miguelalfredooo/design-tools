-- Move effort/impact from options to votes (voter-provided ratings)
ALTER TABLE voting_votes ADD COLUMN IF NOT EXISTS effort text;
ALTER TABLE voting_votes ADD COLUMN IF NOT EXISTS impact text;
