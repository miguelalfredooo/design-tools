-- Carrier Design Tools - Initial Schema
-- All tables for design sessions, voting, explorations, and research

-- ============================================================================
-- VOTING SESSIONS & OPTIONS
-- ============================================================================

CREATE TABLE voting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  preview_url TEXT,
  problem TEXT,
  goal TEXT,
  audience TEXT,
  constraints TEXT,
  participant_count INTEGER DEFAULT 1,
  creator_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voting_sessions_creator ON voting_sessions(creator_token);
CREATE INDEX idx_voting_sessions_created_at ON voting_sessions(created_at DESC);

CREATE TABLE voting_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_type TEXT DEFAULT 'none',
  media_url TEXT,
  position INTEGER DEFAULT 0,
  rationale TEXT,
  effort TEXT,
  impact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voting_options_session ON voting_options(session_id);
CREATE INDEX idx_voting_options_position ON voting_options(position);

CREATE TABLE voting_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES voting_options(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  voter_token TEXT,
  effort TEXT,
  impact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_voting_votes_option ON voting_votes(option_id);
CREATE INDEX idx_voting_votes_session ON voting_votes(session_id);
CREATE INDEX idx_voting_votes_voter ON voting_votes(voter_token);

-- ============================================================================
-- EXPLORATIONS & SPATIAL COMMENTS
-- ============================================================================

CREATE TABLE explorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_explorations_session ON explorations(session_id);

CREATE TABLE votes_explorations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id UUID NOT NULL REFERENCES explorations(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  voter_token TEXT,
  vote_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_votes_explorations_exploration ON votes_explorations(exploration_id);
CREATE INDEX idx_votes_explorations_session ON votes_explorations(session_id);

CREATE TABLE spatial_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exploration_id UUID NOT NULL REFERENCES explorations(id) ON DELETE CASCADE,
  x FLOAT,
  y FLOAT,
  comment TEXT,
  author TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spatial_comments_exploration ON spatial_comments(exploration_id);

-- ============================================================================
-- RESEARCH & OBSERVATIONS
-- ============================================================================

CREATE TABLE research_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
  observation TEXT,
  area TEXT,
  category TEXT,
  body TEXT,
  contributor TEXT,
  source_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_research_observations_session ON research_observations(session_id);
CREATE INDEX idx_research_observations_category ON research_observations(category);
CREATE INDEX idx_research_observations_area ON research_observations(area);

CREATE TABLE research_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_research_segments_name ON research_segments(name);

CREATE TABLE research_segment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID NOT NULL REFERENCES research_segments(id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  source_observation_ids UUID[],
  batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_research_segment_items_segment ON research_segment_items(segment_id);
CREATE INDEX idx_research_segment_items_batch ON research_segment_items(batch_id);

CREATE TABLE research_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT,
  body TEXT,
  mentions INTEGER,
  tags TEXT[],
  source_session_ids UUID[],
  metadata JSONB,
  batch_id UUID NOT NULL,
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_research_insights_batch ON research_insights(batch_id);
CREATE INDEX idx_research_insights_type ON research_insights(type);
CREATE INDEX idx_research_insights_session ON research_insights(session_id);

-- ============================================================================
-- SHARE TOKENS (for public observation submission)
-- ============================================================================

CREATE TABLE research_share_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  created_by TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_research_share_tokens_token ON research_share_tokens(token);

-- ============================================================================
-- GALLERY COMMENTS (for nooooowhere integration)
-- ============================================================================

CREATE TABLE gallery_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID,
  comment TEXT,
  agent_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gallery_comments_item ON gallery_comments(item_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE explorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes_explorations ENABLE ROW LEVEL SECURITY;
ALTER TABLE spatial_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_segment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES (public read/write - internal tool)
-- ============================================================================

CREATE POLICY "Sessions are publicly readable" ON voting_sessions FOR SELECT USING (true);
CREATE POLICY "Sessions are publicly insertable" ON voting_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Sessions are publicly updatable" ON voting_sessions FOR UPDATE USING (true);

CREATE POLICY "Options are publicly readable" ON voting_options FOR SELECT USING (true);
CREATE POLICY "Options are publicly insertable" ON voting_options FOR INSERT WITH CHECK (true);

CREATE POLICY "Votes are publicly readable" ON voting_votes FOR SELECT USING (true);
CREATE POLICY "Votes are publicly insertable" ON voting_votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Explorations are publicly readable" ON explorations FOR SELECT USING (true);
CREATE POLICY "Explorations are publicly insertable" ON explorations FOR INSERT WITH CHECK (true);

CREATE POLICY "Exploration votes are publicly readable" ON votes_explorations FOR SELECT USING (true);
CREATE POLICY "Exploration votes are publicly insertable" ON votes_explorations FOR INSERT WITH CHECK (true);

CREATE POLICY "Spatial comments are publicly readable" ON spatial_comments FOR SELECT USING (true);
CREATE POLICY "Spatial comments are publicly insertable" ON spatial_comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Observations are publicly readable" ON research_observations FOR SELECT USING (true);
CREATE POLICY "Observations are publicly insertable" ON research_observations FOR INSERT WITH CHECK (true);

CREATE POLICY "Segments are publicly readable" ON research_segments FOR SELECT USING (true);
CREATE POLICY "Segments are publicly insertable" ON research_segments FOR INSERT WITH CHECK (true);

CREATE POLICY "Segment items are publicly readable" ON research_segment_items FOR SELECT USING (true);
CREATE POLICY "Segment items are publicly insertable" ON research_segment_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Insights are publicly readable" ON research_insights FOR SELECT USING (true);
CREATE POLICY "Insights are publicly insertable" ON research_insights FOR INSERT WITH CHECK (true);

CREATE POLICY "Gallery comments are publicly readable" ON gallery_comments FOR SELECT USING (true);
CREATE POLICY "Gallery comments are publicly insertable" ON gallery_comments FOR INSERT WITH CHECK (true);
