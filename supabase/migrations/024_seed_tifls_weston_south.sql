-- Seed Tifls for Majlis "Weston South"
-- Passwords hashed with bcrypt (cost 10) via pgcrypto for compatibility with app login
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (member_code, password_hash, role, majlis_id, name, profile_completed)
SELECT * FROM (VALUES
  ('44571', crypt('kmz371', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Abdul Rafay', false),
  ('43918', crypt('vxb294', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Ashir Ahmed', false),
  ('25656', crypt('rht489', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Faran Kahlon', false),
  ('35453', crypt('nwj513', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Fareed Ahmed Butt', false),
  ('49394', crypt('kym642', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Farhan Hafeez', false),
  ('43321', crypt('ptz729', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Fraaj Ahmed', false),
  ('40088', crypt('bxf937', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Muneef Ahmed', false),
  ('28445', crypt('qws184', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Safeer Khurram Bajwa', false),
  ('26669', crypt('nhc453', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Sahir Hayat Bajwa', false),
  ('40089', crypt('ryp362', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Sahib Ahmed', false),
  ('44572', crypt('dmt291', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Saram', false),
  ('35451', crypt('fxn847', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Samikh Butt', false),
  ('42665', crypt('kpw318', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Zain ul Abideen', false),
  ('40032', crypt('rzq573', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Weston South' LIMIT 1), 'Zayyan Ahmed', false)
) AS v(member_code, password_hash, role, majlis_id, name, profile_completed)
ON CONFLICT (member_code) DO NOTHING;
