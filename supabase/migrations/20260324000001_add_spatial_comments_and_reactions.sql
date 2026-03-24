-- Add spatial coordinates to design_comments
ALTER TABLE design_comments ADD COLUMN IF NOT EXISTS x_pct numeric;
ALTER TABLE design_comments ADD COLUMN IF NOT EXISTS y_pct numeric;

-- Create design_reactions table
CREATE TABLE IF NOT EXISTS design_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES voting_options(id) ON DELETE CASCADE,
  voter_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (session_id, option_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_design_reactions_session ON design_reactions(session_id);
CREATE INDEX IF NOT EXISTS idx_design_reactions_option ON design_reactions(option_id);

ALTER TABLE design_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions are publicly readable"
  ON design_reactions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert a reaction"
  ON design_reactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete a reaction"
  ON design_reactions FOR DELETE USING (true);
