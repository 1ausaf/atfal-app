-- Seed Tifls for Majlis "Ahmadiyya Abode of Peace"
-- Passwords hashed with bcrypt (cost 10) via pgcrypto for compatibility with app login
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (member_code, password_hash, role, majlis_id, name, profile_completed)
SELECT * FROM (VALUES
  ('34606', crypt('k7mz2n', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Aariz Riasat', false),
  ('41546', crypt('3vx9bp', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Abdul Waheed', false),
  ('32768', crypt('r5ht1q', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Bashir Karim Alhaj', false),
  ('28806', crypt('8nw4jd', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Faraan Faheem Shahid', false),
  ('28677', crypt('g6ky3m', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Fauzan Ahmed', false),
  ('35858', crypt('9bx5fv', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Jamshaid Saad Ahmad', false),
  ('40461', crypt('m4qw1s', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Khaqan Aamir Minhas', false),
  ('30377', crypt('4nh8ck', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Masroor Misbah', false),
  ('25949', crypt('z3ry6p', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Munam Tanzeel Ahmed', false),
  ('33270', crypt('v7dm2t', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Murtaz Ahmad Wains', false),
  ('28389', crypt('h8rz3q', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Zain Afzal Mirza', false),
  ('25762', crypt('2tw5ym', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Zayad Butt', false),
  ('37972', crypt('b6nx4k', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Rayan Arif Sandhu', false),
  ('39429', crypt('q9mw7f', gen_salt('bf', 10)), 'tifl'::user_role, (SELECT id FROM majlis WHERE name = 'Ahmadiyya Abode of Peace' LIMIT 1), 'Faran Asif', false)
) AS v(member_code, password_hash, role, majlis_id, name, profile_completed)
ON CONFLICT (member_code) DO NOTHING;
