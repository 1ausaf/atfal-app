-- Allow homework.majlis_id to be NULL for region-wide (all majlis) homework.
ALTER TABLE homework ALTER COLUMN majlis_id DROP NOT NULL;
