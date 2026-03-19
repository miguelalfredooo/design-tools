-- RPC function to get vote count for a session
CREATE OR REPLACE FUNCTION get_vote_count(p_session_id UUID)
RETURNS INT AS $$
DECLARE
  vote_count INT;
BEGIN
  SELECT COUNT(DISTINCT voter_token)::INT INTO vote_count
  FROM voting_votes
  WHERE session_id = p_session_id;

  RETURN COALESCE(vote_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;
