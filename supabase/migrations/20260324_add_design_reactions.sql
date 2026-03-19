-- Design reactions table for voting sessions
CREATE TABLE IF NOT EXISTS design_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES voting_options(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_design_reactions_session ON design_reactions(session_id);
CREATE INDEX IF NOT EXISTS idx_design_reactions_option ON design_reactions(option_id);
CREATE INDEX IF NOT EXISTS idx_design_reactions_voter ON design_reactions(voter_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_design_reactions_unique ON design_reactions(session_id, option_id, voter_id);

-- RLS
ALTER TABLE design_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions are publicly readable" ON design_reactions FOR SELECT USING (true);
CREATE POLICY "Reactions are publicly insertable" ON design_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Reactions are deletable" ON design_reactions FOR DELETE USING (true);
