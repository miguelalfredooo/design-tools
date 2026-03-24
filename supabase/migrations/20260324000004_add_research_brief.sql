-- Single-row research brief for the insights hub
CREATE TABLE IF NOT EXISTS research_brief (
  id                 text PRIMARY KEY DEFAULT 'main',
  title              text,
  description        text,
  problem_statement  text,
  idea               text,
  metrics            text,  -- comma-separated KPIs / success metrics
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE research_brief ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brief is publicly readable" ON research_brief FOR SELECT USING (true);
CREATE POLICY "Anyone can upsert brief"    ON research_brief FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update brief"    ON research_brief FOR UPDATE USING (true);
