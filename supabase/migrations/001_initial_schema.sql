-- Majlis (7 fixed groups)
CREATE TABLE majlis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- Users (all roles: tifl, local_nazim, regional_nazim)
CREATE TYPE user_role AS ENUM ('tifl', 'local_nazim', 'regional_nazim');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_code TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  majlis_id UUID REFERENCES majlis(id),
  name TEXT,
  age INTEGER,
  age_group TEXT,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_member_code ON users(member_code);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_majlis ON users(majlis_id);

-- Homework (Majlis-scoped)
CREATE TABLE homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  majlis_id UUID NOT NULL REFERENCES majlis(id),
  title TEXT NOT NULL,
  description TEXT,
  due_by TIMESTAMPTZ NOT NULL,
  links JSONB DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_homework_majlis ON homework(majlis_id);

-- Homework submissions
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  status submission_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  points_awarded INTEGER DEFAULT 0,
  UNIQUE(homework_id, user_id)
);

CREATE INDEX idx_homework_submissions_homework ON homework_submissions(homework_id);
CREATE INDEX idx_homework_submissions_user ON homework_submissions(user_id);

-- Lesson activities (Regional only)
CREATE TYPE activity_type AS ENUM ('video', 'article');

CREATE TABLE lesson_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  type activity_type NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lesson questions (short_quiz = auto-grade, long_answer = manual)
CREATE TYPE question_type AS ENUM ('short_quiz', 'long_answer');

CREATE TABLE lesson_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES lesson_activities(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type question_type NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  options JSONB
);

CREATE INDEX idx_lesson_questions_activity ON lesson_questions(activity_id);

-- Lesson submissions (status: pending = awaiting grade, graded = points awarded)
CREATE TYPE lesson_submission_status AS ENUM ('pending', 'graded');

CREATE TABLE lesson_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES lesson_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  answers JSONB NOT NULL DEFAULT '{}',
  status lesson_submission_status NOT NULL DEFAULT 'pending',
  points_awarded INTEGER DEFAULT 0,
  graded_by UUID REFERENCES users(id),
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(activity_id, user_id)
);

CREATE INDEX idx_lesson_submissions_activity ON lesson_submissions(activity_id);
CREATE INDEX idx_lesson_submissions_user ON lesson_submissions(user_id);

-- Events
CREATE TYPE event_type AS ENUM ('regional', 'local', 'national');

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  link TEXT,
  event_type event_type NOT NULL,
  majlis_id UUID REFERENCES majlis(id),
  event_date TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_majlis ON events(majlis_id);

-- Leaderboard view: total points per user (homework approved + lesson graded)
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  u.id,
  u.name,
  u.age,
  u.age_group,
  u.majlis_id,
  (COALESCE(hw.points, 0)::integer + COALESCE(ls.points, 0)::integer) AS total_points
FROM users u
LEFT JOIN (
  SELECT user_id, SUM(points_awarded) AS points
  FROM homework_submissions
  WHERE status = 'approved'
  GROUP BY user_id
) hw ON u.id = hw.user_id
LEFT JOIN (
  SELECT user_id, SUM(points_awarded)::integer AS points
  FROM lesson_submissions
  WHERE status = 'graded'
  GROUP BY user_id
) ls ON u.id = ls.user_id
WHERE u.role = 'tifl' AND u.deleted_at IS NULL;
