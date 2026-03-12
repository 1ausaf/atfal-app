-- My Life feature: settings, schedule, check-in, habits, goals, achievements

-- Settings: one row per user (onboarding completed flag)
CREATE TABLE my_life_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Schedule block type enum
CREATE TYPE schedule_block_type AS ENUM (
  'wake_up', 'fajr', 'school', 'homework', 'quran_reading',
  'sports', 'family_time', 'masjid', 'free_time', 'sleep'
);

CREATE TABLE schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  block_type schedule_block_type NOT NULL,
  label TEXT,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedule_blocks_user ON schedule_blocks(user_id);
CREATE INDEX idx_schedule_blocks_user_day ON schedule_blocks(user_id, day_of_week);

-- Daily check-in mood enum
CREATE TYPE check_in_mood AS ENUM ('great', 'good', 'okay', 'bad');

CREATE TABLE daily_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood check_in_mood NOT NULL,
  prayed_today BOOLEAN NOT NULL DEFAULT false,
  read_quran_today BOOLEAN NOT NULL DEFAULT false,
  helped_someone_today BOOLEAN NOT NULL DEFAULT false,
  learned_something_today BOOLEAN NOT NULL DEFAULT false,
  one_good_thing TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_check_ins_user ON daily_check_ins(user_id);
CREATE INDEX idx_daily_check_ins_date ON daily_check_ins(date);

-- Global habit definitions (seed below)
CREATE TABLE habit_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon_name TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habit_definitions(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, habit_id, date)
);

CREATE INDEX idx_habit_completions_user ON habit_completions(user_id);
CREATE INDEX idx_habit_completions_user_date ON habit_completions(user_id, date);

-- Goals
CREATE TYPE goal_target_type AS ENUM ('streak_days', 'count', 'surah', 'custom');
CREATE TYPE goal_status AS ENUM ('active', 'completed');

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_type goal_target_type NOT NULL DEFAULT 'custom',
  target_value INTEGER,
  current_value INTEGER NOT NULL DEFAULT 0,
  status goal_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_goals_user ON goals(user_id);

-- Achievements (global, seed below)
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  badge_icon TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- RLS: no direct anon access (app uses API with server checks)
ALTER TABLE my_life_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No anon my_life_settings" ON my_life_settings FOR ALL USING (false);
CREATE POLICY "No anon schedule_blocks" ON schedule_blocks FOR ALL USING (false);
CREATE POLICY "No anon daily_check_ins" ON daily_check_ins FOR ALL USING (false);
CREATE POLICY "No anon habit_definitions" ON habit_definitions FOR ALL USING (false);
CREATE POLICY "No anon habit_completions" ON habit_completions FOR ALL USING (false);
CREATE POLICY "No anon goals" ON goals FOR ALL USING (false);
CREATE POLICY "No anon achievements" ON achievements FOR ALL USING (false);
CREATE POLICY "No anon user_achievements" ON user_achievements FOR ALL USING (false);

-- Seed habit_definitions
INSERT INTO habit_definitions (slug, label, icon_name, sort_order) VALUES
  ('fajr_prayer', 'Fajr prayer', 'fajr', 1),
  ('daily_prayers', 'Other daily prayers', 'prayer', 2),
  ('quran_reading', 'Qur''an reading', 'quran', 3),
  ('memorize_quran', 'Memorizing Qur''an', 'memorize', 4),
  ('helping_parents', 'Helping parents', 'help', 5),
  ('kind_to_others', 'Being kind to others', 'kind', 6),
  ('telling_truth', 'Telling the truth', 'truth', 7),
  ('exercise', 'Exercise or sports', 'exercise', 8),
  ('completing_lessons', 'Completing lessons', 'lessons', 9);

-- Seed achievements
INSERT INTO achievements (slug, label, description, badge_icon, sort_order) VALUES
  ('fajr_champion', 'Fajr Champion', 'Prayed Fajr 7 days in a row', 'star', 1),
  ('quran_lover', 'Qur''an Lover', 'Read Qur''an 7 days in a row', 'quran', 2),
  ('helping_hero', 'Helping Hero', 'Helped others 7 days in a row', 'heart', 3),
  ('truthful_muslim', 'Truthful Muslim', 'Told the truth every day for a week', 'shield', 4),
  ('week_warrior', 'Week Warrior', 'Completed all habits for a full week', 'trophy', 5);
