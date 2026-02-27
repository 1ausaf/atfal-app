-- Enable RLS on all tables (policies applied via service role / server-side in app for custom auth)
-- With custom auth (NextAuth + our users table), Supabase anon key is used from server with no user JWT.
-- So we either: 1) Use service_role key server-side and bypass RLS, or 2) Set auth.uid() via a custom JWT.
-- For simplicity we use server-side Supabase client with anon key and enforce permissions in API/server actions.
-- Still enable RLS so direct anon access from client cannot read/write without our API.

ALTER TABLE majlis ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Restrict anon to no direct access (app uses server actions/API with checks)
CREATE POLICY "No anon majlis" ON majlis FOR ALL USING (false);
CREATE POLICY "No anon users" ON users FOR ALL USING (false);
CREATE POLICY "No anon homework" ON homework FOR ALL USING (false);
CREATE POLICY "No anon homework_submissions" ON homework_submissions FOR ALL USING (false);
CREATE POLICY "No anon lesson_activities" ON lesson_activities FOR ALL USING (false);
CREATE POLICY "No anon lesson_questions" ON lesson_questions FOR ALL USING (false);
CREATE POLICY "No anon lesson_submissions" ON lesson_submissions FOR ALL USING (false);
CREATE POLICY "No anon events" ON events FOR ALL USING (false);

-- Allow service_role full access (default when using service_role key)
