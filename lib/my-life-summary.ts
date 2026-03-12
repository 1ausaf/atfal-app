import type { SupabaseClient } from "@supabase/supabase-js";

export interface MyLifeSummaryResult {
  name: string | null;
  streaks: { label: string; streak: number }[];
  recentMoods: { date: string; mood: string }[];
  goals: { title: string; current_value: number; target_value: number | null }[];
  badges: string[];
}

export async function getMyLifeSummaryForTifl(
  supabase: SupabaseClient,
  userId: string
): Promise<MyLifeSummaryResult | null> {
  const { data: tifl } = await supabase
    .from("users")
    .select("name")
    .eq("id", userId)
    .eq("role", "tifl")
    .single();
  if (!tifl) return null;

  const [completionsRes, checkInsRes, goalsRes, achievementsRes] = await Promise.all([
    supabase.from("habit_completions").select("habit_id, date").eq("user_id", userId),
    supabase.from("daily_check_ins").select("date, mood").eq("user_id", userId).order("date", { ascending: false }).limit(7),
    supabase.from("goals").select("id, title, current_value, target_value").eq("user_id", userId).eq("status", "active"),
    supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
  ]);

  const completions = completionsRes.data ?? [];
  const byHabit = new Map<string, string[]>();
  completions.forEach((c) => {
    const list = byHabit.get(c.habit_id) ?? [];
    list.push(c.date);
    byHabit.set(c.habit_id, list);
  });
  const { data: defs } = await supabase.from("habit_definitions").select("id, label").order("sort_order");
  const defMap = new Map((defs ?? []).map((d) => [d.id, d.label]));
  const streaks: { label: string; streak: number }[] = [];
  const today = new Date().toISOString().slice(0, 10);
  byHabit.forEach((dates, habitId) => {
    const sorted = [...dates].sort().reverse();
    let streak = 0;
    let expect = today;
    for (const d of sorted) {
      if (d !== expect) break;
      streak++;
      const next = new Date(d + "T12:00:00");
      next.setDate(next.getDate() - 1);
      expect = next.toISOString().slice(0, 10);
    }
    if (streak > 0) {
      streaks.push({ label: defMap.get(habitId) ?? "Habit", streak });
    }
  });

  const ua = achievementsRes.data ?? [];
  const achIds = [...new Set(ua.map((x) => x.achievement_id))];
  const { data: achRows } = achIds.length
    ? await supabase.from("achievements").select("label").in("id", achIds)
    : { data: [] };

  return {
    name: tifl.name,
    streaks,
    recentMoods: (checkInsRes.data ?? []).map((c) => ({ date: c.date, mood: c.mood })),
    goals: (goalsRes.data ?? []).map((g) => ({ title: g.title, current_value: g.current_value, target_value: g.target_value })),
    badges: (achRows ?? []).map((b) => b.label),
  };
}
