import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session || (role !== "local_nazim" && role !== "regional_nazim" && role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: tifl } = await supabase.from("users").select("id, majlis_id, name").eq("id", userId).eq("role", "tifl").single();
  if (!tifl) return NextResponse.json({ error: "Tifl not found" }, { status: 404 });

  if (role === "local_nazim" && session.user.majlisId !== tifl.majlis_id) {
    return NextResponse.json({ error: "Not in your majlis" }, { status: 403 });
  }

  const [completionsRes, checkInsRes, goalsRes, achievementsRes] = await Promise.all([
    supabase.from("habit_completions").select("habit_id, date").eq("user_id", userId),
    supabase.from("daily_check_ins").select("date, mood").eq("user_id", userId).order("date", { ascending: false }).limit(7),
    supabase.from("goals").select("id, title, current_value, target_value, status").eq("user_id", userId).eq("status", "active"),
    supabase.from("user_achievements").select("achievement_id").eq("user_id", userId),
  ]);

  const completions = completionsRes.data ?? [];
  const byHabit = new Map<string, string[]>();
  completions.forEach((c) => {
    const list = byHabit.get(c.habit_id) ?? [];
    list.push(c.date);
    byHabit.set(c.habit_id, list);
  });
  const defs = await supabase.from("habit_definitions").select("id, slug, label").order("sort_order");
  const defMap = new Map((defs.data ?? []).map((d) => [d.id, d]));
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
      const def = defMap.get(habitId);
      streaks.push({ label: def?.label ?? "Habit", streak });
    }
  });

  const checkIns = checkInsRes.data ?? [];
  const goals = goalsRes.data ?? [];
  const ua = achievementsRes.data ?? [];
  const achIds = [...new Set(ua.map((x) => x.achievement_id))];
  const { data: achRows } = achIds.length
    ? await supabase.from("achievements").select("id, label").in("id", achIds)
    : { data: [] };
  const badges = achRows ?? [];

  return NextResponse.json({
    name: tifl.name,
    streaks,
    recentMoods: checkIns.map((c) => ({ date: c.date, mood: c.mood })),
    goals: goals.map((g) => ({ title: g.title, current_value: g.current_value, target_value: g.target_value })),
    badges: badges.map((b) => b.label),
  });
}
