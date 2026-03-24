-- Add structured research brief context to share tokens
ALTER TABLE research_share_tokens
  ADD COLUMN IF NOT EXISTS context jsonb;

-- context shape:
-- {
--   "title": "string",
--   "question": "string",
--   "hypothesis": "string",
--   "areas": ["string"],
--   "prompts": ["string"]
-- }
