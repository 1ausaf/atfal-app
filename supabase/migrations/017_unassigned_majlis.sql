-- "Unassigned" majlis for new Tifls so regional can filter unassigned easily
INSERT INTO majlis (name) VALUES ('Unassigned') ON CONFLICT (name) DO NOTHING;

-- Group existing Tifls with no majlis under Unassigned for consistent filtering
UPDATE users
SET majlis_id = (SELECT id FROM majlis WHERE name = 'Unassigned' LIMIT 1)
WHERE role = 'tifl' AND majlis_id IS NULL;
