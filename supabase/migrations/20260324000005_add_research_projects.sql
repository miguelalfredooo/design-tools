-- Research projects table (brief fields merged in)
CREATE TABLE research_projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL DEFAULT 'Untitled Research',
  description       text,
  problem_statement text,
  idea              text,
  metrics           text,
  status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects are publicly readable" ON research_projects FOR SELECT USING (true);
CREATE POLICY "Anyone can insert projects"     ON research_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update projects"     ON research_projects FOR UPDATE USING (true);

-- Migrate existing research_brief into a default project
INSERT INTO research_projects (id, name, description, problem_statement, idea, metrics)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  COALESCE((SELECT title FROM research_brief WHERE id = 'main'), 'Default Research'),
  (SELECT description FROM research_brief WHERE id = 'main'),
  (SELECT problem_statement FROM research_brief WHERE id = 'main'),
  (SELECT idea FROM research_brief WHERE id = 'main'),
  (SELECT metrics FROM research_brief WHERE id = 'main');

-- Add project_id to observations
ALTER TABLE research_observations
  ADD COLUMN project_id uuid REFERENCES research_projects(id) ON DELETE CASCADE;
UPDATE research_observations SET project_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE research_observations ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE research_observations ALTER COLUMN project_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Add project_id to segments
ALTER TABLE research_segments
  ADD COLUMN project_id uuid REFERENCES research_projects(id) ON DELETE CASCADE;
UPDATE research_segments SET project_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE research_segments ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE research_segments ALTER COLUMN project_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- Add project_id to share tokens
ALTER TABLE research_share_tokens
  ADD COLUMN project_id uuid REFERENCES research_projects(id) ON DELETE SET NULL;
UPDATE research_share_tokens SET project_id = '00000000-0000-0000-0000-000000000001';

CREATE INDEX idx_research_observations_project ON research_observations(project_id);
CREATE INDEX idx_research_segments_project ON research_segments(project_id);
