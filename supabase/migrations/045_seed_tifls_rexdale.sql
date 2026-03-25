-- Seed Tifls for Majlis "Rexdale"
-- Passwords hashed with bcrypt (cost 10) via pgcrypto for compatibility with app login
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (member_code, password_hash, role, majlis_id, name, profile_completed)
SELECT * FROM (VALUES
  ('31641', crypt('cake73', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Abdul-Haadi Awan', false),
  ('27999', crypt('milk84', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Abdulbaari Awan', false),
  ('33608', crypt('rock51', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Abdullah Ahsan Anwar', false),
  ('37726', crypt('sand26', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Ahad Ahmad', false),
  ('35026', crypt('lake39', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Aryyan Ahmad Chaudhry', false),
  ('38921', crypt('frog47', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Atif Ahmad', false),
  ('37730', crypt('dust12', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Ayaan Wahab Munawar', false),
  ('37478', crypt('bell68', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Azeem Masood', false),
  ('33569', crypt('clip95', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Azfar Mahmood', false),
  ('37155', crypt('stem24', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Dabeer Ahmad Khan', false),
  ('33325', crypt('fork57', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Haroon Saeed Mir', false),
  ('27128', crypt('glow83', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Kamran Asim Zubair', false),
  ('38390', crypt('path36', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Muhammad Arhaan Moosa', false),
  ('38920', crypt('drum19', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Nabeel Ahmad', false),
  ('37739', crypt('coal72', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Shahmeer Khan', false),
  ('33622', crypt('tide45', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Shehroze Malik', false),
  ('37731', crypt('plum88', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Wasil Mehmood Khan', false),
  ('37156', crypt('dusk31', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Zaryab Ahmad', false),
  ('47625', crypt('mist64', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Rexdale' LIMIT 1), 'Zawar Ahmad', false)
) AS v(member_code, password_hash, role, majlis_id, name, profile_completed)
ON CONFLICT (member_code) DO NOTHING;

