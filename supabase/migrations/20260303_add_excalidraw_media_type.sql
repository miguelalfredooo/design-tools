-- Add 'excalidraw' to the media_type check constraint on voting_options
ALTER TABLE voting_options
DROP CONSTRAINT voting_options_media_type_check;

ALTER TABLE voting_options
ADD CONSTRAINT voting_options_media_type_check
CHECK (media_type IN ('none', 'image', 'figma-embed', 'excalidraw'));
