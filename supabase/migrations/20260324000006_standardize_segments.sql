-- Rename existing Creator Tools segments to standard names
UPDATE research_segments SET name = 'Content Creators'   WHERE id = 'eaa6fe04-92ec-4a67-aab1-ef6fa494a938';
UPDATE research_segments SET name = 'Lapsed Users'       WHERE id = 'cf2753fb-d72f-4f7e-822b-c7e1698c6d01';
UPDATE research_segments SET name = 'Super Users'        WHERE id = 'b2c83ef9-41a8-426c-8bc4-82eab068d18a';
UPDATE research_segments SET name = 'Community Members'  WHERE id = '403f87d3-52f5-4356-a9d6-15e7eeb56473';

-- Seed the two standard segments that have no existing data yet
INSERT INTO research_segments (name, project_id)
VALUES
  ('New Users',       '00000000-0000-0000-0000-000000000001'),
  ('Regular Members', '00000000-0000-0000-0000-000000000001');
