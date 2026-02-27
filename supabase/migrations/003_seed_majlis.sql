INSERT INTO majlis (name) VALUES
  ('Ahmadiyya Abode of Peace'),
  ('Rexdale'),
  ('Weston North West'),
  ('Weston North East'),
  ('Weston South'),
  ('Weston Islington'),
  ('Emery Village')
ON CONFLICT (name) DO NOTHING;
