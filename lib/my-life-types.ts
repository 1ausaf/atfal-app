export type ScheduleBlockType =
  | "wake_up"
  | "fajr"
  | "school"
  | "homework"
  | "quran_reading"
  | "sports"
  | "family_time"
  | "masjid"
  | "free_time"
  | "sleep"
  | "custom";

export type CheckInMood = "great" | "good" | "okay" | "bad";

export type GoalTargetType = "streak_days" | "count" | "surah" | "custom";
export type GoalStatus = "active" | "completed";

export interface MyLifeSettings {
  user_id: string;
  onboarding_completed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleBlock {
  id: string;
  user_id: string;
  day_of_week: number;
  block_type: ScheduleBlockType;
  label: string | null;
  start_time: string | null;
  end_time: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DailyCheckIn {
  id: string;
  user_id: string;
  date: string;
  mood: CheckInMood;
  prayed_today: boolean;
  read_quran_today: boolean;
  helped_someone_today: boolean;
  learned_something_today: boolean;
  one_good_thing: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HabitDefinition {
  id: string;
  slug: string;
  label: string;
  icon_name: string | null;
  sort_order: number;
  is_mandatory: boolean;
  created_at?: string;
}

export interface HabitCompletion {
  id: string;
  user_id: string;
  habit_id: string;
  date: string;
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_type: GoalTargetType;
  target_value: number | null;
  current_value: number;
  status: GoalStatus;
  due_date: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Achievement {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  badge_icon: string | null;
  sort_order: number;
  created_at?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

export const SCHEDULE_BLOCK_LABELS: Record<ScheduleBlockType, string> = {
  wake_up: "Wake up",
  fajr: "Fajr prayer",
  school: "School",
  homework: "Homework",
  quran_reading: "Qur'an reading",
  sports: "Sports or exercise",
  family_time: "Family time",
  masjid: "Masjid time",
  free_time: "Free time",
  sleep: "Sleep",
  custom: "Custom",
};
