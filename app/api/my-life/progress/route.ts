import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getTodayToronto } from "@/lib/datetime";

function parseDate(s: string): Date {
  return new Date(s + "T12:00:00");
}

function getStreakForHabit(completions: { date: string }[]): number {
  if (completions.length === 0) return 0;
  const sorted = [...completions].map((c) => c.date).sort().reverse();
  const today = getTodayToronto();
  let streak = 0;
  let expect = today;
  for (const d of sorted) {
    if (d !== expect) break;
    streak++;
    const next = new Date(parseDate(d));
    next.setDate(next.getDate() - 1);
    expect = next.toISOString().slice(0, 10);
  }
  return streak;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createSupabaseServerClient();
  const userId = session.user.id;

  const [checkInsRes, completionsRes, achievementsRes, mandatoryRes, selectionsRes, goalHabitsRes] = await Promise.all([
    supabase.from("daily_check_ins").select("helped_someone_today, one_good_thing").eq("user_id", userId),
    supabase.from("habit_completions").select("habit_id, date").eq("user_id", userId),
    supabase.from("user_achievements").select("achievement_id, earned_at").eq("user_id", userId).order("earned_at", { ascending: false }),
    supabase.from("habit_definitions").select("id, label").eq("is_mandatory", true).order("sort_order"),
    supabase.from("tifl_habit_selections").select("habit_definition_id").eq("user_id", userId),
    supabase.from("goals").select("id").eq("user_id", userId).eq("status", "active"),
  ]);

  let customDefs: { id: string; label: string }[] = [];
  try {
    const customRes = await supabase
      .from("habit_definitions")
      .select("id, label")
      .eq("user_id", userId)
      .order("sort_order");
    customDefs = customRes.error ? [] : (customRes.data ?? []);
  } catch {
    // user_id column may not exist yet (migration 032); continue without custom habits
  }

  const checkIns = checkInsRes.data ?? [];
  const completions = completionsRes.data ?? [];
  const userAchievements = achievementsRes.data ?? [];
  const achievementIds = [...new Set(userAchievements.map((ua: { achievement_id: string }) => ua.achievement_id))];
  const { data: achievementRows } = achievementIds.length
    ? await supabase.from("achievements").select("id, slug, label, description, badge_icon").in("id", achievementIds)
    : { data: [] };
  const achievementMap = new Map((achievementRows ?? []).map((a) => [a.id, a]));
  const badges = userAchievements.map((ua: { achievement_id: string }) => achievementMap.get(ua.achievement_id)).filter(Boolean);

  let goodDeeds = 0;
  checkIns.forEach((c) => {
    if (c.helped_someone_today) goodDeeds++;
    if (c.one_good_thing && c.one_good_thing.trim()) goodDeeds++;
  });

  const selectedIds = (selectionsRes.data ?? []).map((r: { habit_definition_id: string }) => r.habit_definition_id);
  const activeGoalIds = (goalHabitsRes.data ?? []).map((g: { id: string }) => g.id);
  let goalHabitIds: string[] = [];
  if (activeGoalIds.length > 0) {
    const { data: gh } = await supabase.from("goal_habits").select("habit_definition_id").in("goal_id", activeGoalIds);
    goalHabitIds = [...new Set((gh ?? []).map((r: { habit_definition_id: string }) => r.habit_definition_id))];
  }
  const mandatoryDefs = mandatoryRes.data ?? [];
  let optionalDefs: { id: string; label: string }[] = [];
  const allOptionalIds = [...new Set([...selectedIds, ...goalHabitIds])];
  if (allOptionalIds.length > 0) {
    const { data } = await supabase.from("habit_definitions").select("id, label").in("id", allOptionalIds).order("sort_order");
    optionalDefs = (data ?? []).filter((d: { id: string }) => !mandatoryDefs.some((m: { id: string }) => m.id === d.id));
  }
  const defs = [...mandatoryDefs, ...optionalDefs, ...customDefs];

  const byHabit = new Map<string, { date: string }[]>();
  completions.forEach((c) => {
    const list = byHabit.get(c.habit_id) ?? [];
    list.push({ date: c.date });
    byHabit.set(c.habit_id, list);
  });
  let longestStreak = 0;
  const defIds = new Set(defs.map((d: { id: string }) => d.id));
  byHabit.forEach((list, habitId) => {
    if (!defIds.has(habitId)) return;
    const s = getStreakForHabit(list);
    if (s > longestStreak) longestStreak = s;
  });

  const totalHabitsCompleted = completions.filter((c: { habit_id: string }) => defIds.has(c.habit_id)).length;

  const streaks: { habit_id: string; streak: number; label: string }[] = [];
  defs.forEach((h: { id: string; label: string }) => {
    const list = byHabit.get(h.id) ?? [];
    const streak = getStreakForHabit(list);
    if (streak > 0) streaks.push({ habit_id: h.id, streak, label: h.label ?? "Habit" });
  });

  return NextResponse.json({
    goodDeeds,
    longestStreak,
    totalHabitsCompleted,
    badges,
    streaks,
  });
}
