-- Make session_id nullable in research_observations (observations can exist independently)
ALTER TABLE research_observations
ALTER COLUMN session_id DROP NOT NULL;
