-- Direction votes: let team members vote on design directions with an optional reason
CREATE TABLE IF NOT EXISTS direction_votes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  direction_id text NOT NULL,
  voter_name  text NOT NULL,
  reason      text,
  created_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (direction_id, voter_name)
);

ALTER TABLE direction_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read direction votes"
  ON direction_votes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert direction votes"
  ON direction_votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can delete their own direction votes"
  ON direction_votes FOR DELETE USING (true);

CREATE POLICY "Anyone can update direction votes"
  ON direction_votes FOR UPDATE USING (true);
