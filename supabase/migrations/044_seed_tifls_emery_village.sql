-- Seed Tifls for Majlis "Emery Village"
-- Passwords hashed with bcrypt (cost 10) via pgcrypto for compatibility with app login
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (member_code, password_hash, role, majlis_id, name, profile_completed)
SELECT * FROM (VALUES
  ('38682', crypt('blue42', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Aarish Khan', false),
  ('32441', crypt('jump91', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Abdul Moiz Salman', false),
  ('35597', crypt('wind37', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Aleen Gill Jawaid', false),
  ('25703', crypt('fire85', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Danial Ahmad', false),
  ('35466', crypt('moon16', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Ehtisham Ahmed', false),
  ('33474', crypt('wolf53', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Hadi Ahmad Salman', false),
  ('35587', crypt('rain74', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Nabil Mohammad Appiah', false),
  ('36508', crypt('bird29', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Nadi Ahmed', false),
  ('35586', crypt('gold61', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Nayal Mohammad Appiah', false),
  ('50411', crypt('tree48', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Nururahman Bamidele Dikko', false),
  ('37485', crypt('dark93', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Rayan Ahmad Hashmi', false),
  ('35091', crypt('rose17', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Syed Asad Shah', false),
  ('28050', crypt('leaf62', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Waqas Ahmed Farooqui', false),
  ('35467', crypt('star38', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Emery Village' LIMIT 1), 'Xavier Ahmed', false)
) AS v(member_code, password_hash, role, majlis_id, name, profile_completed)
ON CONFLICT (member_code) DO NOTHING;
