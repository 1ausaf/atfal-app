import { createSupabaseServerClient } from "@/lib/supabase";
import { getTodayToronto } from "@/lib/datetime";
import Link from "next/link";

async function getOverviewData(userId: string) {
  const supabase = createSupabaseServerClient();
  const today = getTodayToronto();
  const dayOfWeek = new Date(today + "T12:00:00").getDay(); // 0 = Sun

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString();

  const [scheduleRes, habitsRes, checkInRes, goalsRes, lessonsThisWeekRes] = await Promise.all([
    supabase
      .from("schedule_blocks")
      .select("id, block_type, label, start_time, end_time")
      .eq("user_id", userId)
      .eq("day_of_week", dayOfWeek)
      .order("start_time", { nullsFirst: false }),
    supabase.from("habit_definitions").select("id, slug, label").order("sort_order"),
    supabase
      .from("daily_check_ins")
      .select("id, mood, prayed_today, read_quran_today, helped_someone_today, learned_something_today")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("goals")
      .select("id, title, target_value, current_value, status")
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("lesson_submissions")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", weekAgoIso),
  ]);

  const habitIds = (habitsRes.data ?? []).map((h) => h.id);
  const { data: completions } = habitIds.length
    ? await supabase
        .from("habit_completions")
        .select("habit_id")
        .eq("user_id", userId)
        .eq("date", today)
    : { data: [] };

  const completedHabitIds = new Set((completions ?? []).map((c) => c.habit_id));

  const lessonsThisWeek = (lessonsThisWeekRes.data ?? []).length;

  return {
    schedule: scheduleRes.data ?? [],
    habits: (habitsRes.data ?? []).map((h) => ({
      ...h,
      completed: completedHabitIds.has(h.id),
    })),
    checkIn: checkInRes.data ?? null,
    goals: goalsRes.data ?? [],
    today,
    lessonsThisWeek,
  };
}

const SCHEDULE_LABELS: Record<string, string> = {
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
};

export async function MyLifeOverview({ userId }: { userId: string }) {
  const data = await getOverviewData(userId);

  return (
    <div className="space-y-6">
      <section className="card-kid p-4 md:p-5">
        <h3 className="text-lg font-bold text-gta-text dark:text-slate-100 mb-3">
          Today&apos;s schedule
        </h3>
        {data.schedule.length === 0 ? (
          <p className="text-gta-textSecondary dark:text-slate-400 text-sm">
            No schedule for today. <Link href="/my-life/schedule" className="link-kid">Add your schedule</Link>.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.schedule.map((b) => (
              <li key={b.id} className="flex items-center gap-2 text-gta-text dark:text-slate-200">
                <span className="text-gta-textSecondary dark:text-slate-400 text-sm shrink-0">
                  {b.start_time ?? "—"}–{b.end_time ?? "—"}
                </span>
                <span>{b.label || SCHEDULE_LABELS[b.block_type] || b.block_type}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card-kid p-4 md:p-5">
        <h3 className="text-lg font-bold text-gta-text dark:text-slate-100 mb-3">
          Today&apos;s habits
        </h3>
        {data.habits.length === 0 ? (
          <p className="text-gta-textSecondary dark:text-slate-400 text-sm">
            Habits will appear here. <Link href="/my-life/habits" className="link-kid">Open habit tracker</Link>.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.habits.map((h) => (
              <li key={h.id} className="flex items-center gap-2">
                <span className={h.completed ? "text-gta-primary dark:text-emerald-400" : "text-gta-textSecondary dark:text-slate-400"}>
                  {h.completed ? "✓" : "○"}
                </span>
                <span className="text-gta-text dark:text-slate-200">{h.label}</span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/my-life/habits" className="link-kid text-sm mt-2 inline-block">
          Track habits →
        </Link>
      </section>

      <section className="card-kid p-4 md:p-5">
        <h3 className="text-lg font-bold text-gta-text dark:text-slate-100 mb-3">
          Daily check-in
        </h3>
        {data.checkIn ? (
          <p className="text-gta-text dark:text-slate-200">
            You checked in today. Mood: <span className="capitalize">{data.checkIn.mood}</span>.
          </p>
        ) : (
          <p className="text-gta-textSecondary dark:text-slate-400 text-sm mb-2">
            How are you today? Take a quick check-in.
          </p>
        )}
        <Link href="/my-life/check-in" className="link-kid text-sm">
          {data.checkIn ? "Edit check-in" : "Do check-in"} →
        </Link>
      </section>

      <section className="card-kid p-4 md:p-5">
        <h3 className="text-lg font-bold text-gta-text dark:text-slate-100 mb-3">
          My goals
        </h3>
        {data.goals.length === 0 ? (
          <p className="text-gta-textSecondary dark:text-slate-400 text-sm">
            <Link href="/my-life/goals" className="link-kid">Add a goal</Link> to stay motivated.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.goals.map((g) => (
              <li key={g.id} className="text-gta-text dark:text-slate-200">
                {g.title} — {g.current_value}
                {g.target_value != null ? ` / ${g.target_value}` : ""}
              </li>
            ))}
          </ul>
        )}
        <Link href="/my-life/goals" className="link-kid text-sm mt-2 inline-block">
          Goals →
        </Link>
      </section>

      <section className="card-kid p-4 md:p-5">
        <h3 className="text-lg font-bold text-gta-text dark:text-slate-100 mb-3">
          Spiritual Growth
        </h3>
        <p className="text-gta-text dark:text-slate-200">
          This week: <strong>{data.lessonsThisWeek}</strong> lesson{data.lessonsThisWeek !== 1 ? "s" : ""} completed.
        </p>
        <Link href="/lessons" className="link-kid text-sm mt-2 inline-block">
          Go to Lessons →
        </Link>
      </section>

      <section className="card-kid p-4 md:p-5">
        <h3 className="text-lg font-bold text-gta-text dark:text-slate-100 mb-3">
          Progress & streaks
        </h3>
        <p className="text-gta-textSecondary dark:text-slate-400 text-sm mb-2">
          See your streaks and badges.
        </p>
        <Link href="/my-life/progress" className="link-kid text-sm">
          My Progress →
        </Link>
      </section>
    </div>
  );
}
