ALTER TABLE research_projects
  ADD COLUMN IF NOT EXISTS what_we_are_building text,
  ADD COLUMN IF NOT EXISTS assumptions         text,
  ADD COLUMN IF NOT EXISTS out_of_scope        text;
