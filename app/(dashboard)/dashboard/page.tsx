import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getTodayToronto } from "@/lib/datetime";
import { EventsWidget } from "@/components/events-widget";
import { LeaderboardWidget } from "@/components/leaderboard-widget";
import { HomeworkDueWidget } from "@/components/homework-due-widget";
import { LessonActivitiesWidget } from "@/components/lesson-activities-widget";
import { LoginRewardBanner, LoginStreakDisplay } from "@/components/login-reward-banner";
import Link from "next/link";

async function getSubmissionsToMark(role: string, majlisId: string | null) {
  if (role !== "local_nazim" && role !== "regional_nazim" && role !== "admin") return [];
  const supabase = createSupabaseServerClient();
  let hwQuery = supabase.from("homework").select("id, title, majlis_id");
  if (role === "local_nazim" && majlisId) hwQuery = hwQuery.eq("majlis_id", majlisId);
  const { data: homeworks } = await hwQuery;
  const hwIds = (homeworks ?? []).map((h) => h.id);
  if (!hwIds.length) return [];
  const { data: pending } = await supabase
    .from("homework_submissions")
    .select("homework_id")
    .in("homework_id", hwIds)
    .eq("status", "pending");
  const countByHw = new Map<string, number>();
  (pending ?? []).forEach((p) => countByHw.set(p.homework_id, (countByHw.get(p.homework_id) ?? 0) + 1));
  return (homeworks ?? [])
    .filter((h) => (countByHw.get(h.id) ?? 0) > 0)
    .map((h) => ({ id: h.id, title: h.title, pendingCount: countByHw.get(h.id) ?? 0 }));
}

async function getLoginRewardAndStreak(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  today: string
) {
  let pointsAwardedToday = 0;
  let currentStreak = 0;
  try {
    const { data: loginRow } = await supabase
      .from("activity_log")
      .select("points_awarded")
      .eq("user_id", userId)
      .eq("activity_date", today)
      .eq("activity_type", "login")
      .maybeSingle();
    pointsAwardedToday = loginRow?.points_awarded ?? 0;
    const { data: streakRow } = await supabase
      .from("login_streak")
      .select("current_streak")
      .eq("user_id", userId)
      .maybeSingle();
    currentStreak = streakRow?.current_streak ?? 0;
  } catch {
    // tables may not exist yet
  }
  return { pointsAwardedToday, currentStreak };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const supabase = createSupabaseServerClient();
  const submissionsToMark =
    session.user.role === "local_nazim" || session.user.role === "regional_nazim" || session.user.role === "admin"
      ? await getSubmissionsToMark(session.user.role, session.user.majlisId)
      : [];

  const today = getTodayToronto();
  const loginReward =
    session.user.role === "tifl"
      ? await getLoginRewardAndStreak(supabase, session.user.id, today)
      : { pointsAwardedToday: 0, currentStreak: 0 };

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white tracking-tight">Dashboard</h1>
      {session.user.role === "tifl" && (
        <>
          <LoginRewardBanner
            pointsAwardedToday={loginReward.pointsAwardedToday}
            currentStreak={loginReward.currentStreak}
            streakBonusAwarded={loginReward.pointsAwardedToday === 1050}
            todayKey={today}
          />
          <div className="mb-6">
            <LoginStreakDisplay currentStreak={loginReward.currentStreak} />
          </div>
        </>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-800 shadow-lg p-5">
          <h2 className="font-semibold text-lg mb-3 text-slate-800 dark:text-white">Upcoming events</h2>
          <EventsWidget />
          <Link href="/events" className="link-kid text-sm mt-2 inline-block">View all events</Link>
        </section>
        <section className="card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-800 shadow-lg p-5">
          <h2 className="font-semibold text-lg mb-3 text-slate-800 dark:text-white">Leaderboard (Top 25)</h2>
          <LeaderboardWidget />
          <Link href="/leaderboard" className="link-kid text-sm mt-2 inline-block">Full leaderboard</Link>
        </section>
      </div>
      {(session.user.role === "local_nazim" || session.user.role === "regional_nazim" || session.user.role === "admin") && submissionsToMark.length > 0 && (
        <section className="card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-800 shadow-lg p-5 mt-6">
          <h2 className="font-semibold text-lg mb-3 text-slate-800 dark:text-white">Submissions to mark</h2>
          <ul className="space-y-2">
            {submissionsToMark.map((h) => (
              <li key={h.id}>
                <Link href={`/homework/${h.id}/submissions`} className="link-kid">
                  {h.title}
                </Link>
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">({h.pendingCount} pending)</span>
              </li>
            ))}
          </ul>
          <Link href="/homework" className="link-kid text-sm mt-2 inline-block">View all homework</Link>
        </section>
      )}
      {session.user.role === "tifl" && (
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <section className="card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-800 shadow-lg p-5">
            <h2 className="font-semibold text-lg mb-3 text-slate-800 dark:text-white">Homework due</h2>
            <HomeworkDueWidget />
            <Link href="/homework" className="link-kid text-sm mt-2 inline-block">View all homework</Link>
          </section>
          <section className="card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-800 shadow-lg p-5">
            <h2 className="font-semibold text-lg mb-3 text-slate-800 dark:text-white">Lesson activities</h2>
            <LessonActivitiesWidget />
            <Link href="/lessons" className="link-kid text-sm mt-2 inline-block">View all lessons</Link>
          </section>
        </div>
      )}
    </div>
  );
}
