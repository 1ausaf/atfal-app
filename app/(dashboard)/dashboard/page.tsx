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
import { SalatProgressWidget } from "@/components/salat-progress-widget";
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

  if (session.user.role === "tifl") {
    return (
      <div className="max-w-6xl mx-auto min-h-dvh grid grid-rows-[auto_auto_1fr] gap-4 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-4 shrink-0">
          <h1 className="text-xl font-bold text-gta-text tracking-tight">Dashboard</h1>
          <LoginRewardBanner
            pointsAwardedToday={loginReward.pointsAwardedToday}
            currentStreak={loginReward.currentStreak}
            streakBonusAwarded={loginReward.pointsAwardedToday === 1050}
            todayKey={today}
          />
          <LoginStreakDisplay currentStreak={loginReward.currentStreak} />
        </div>
        <section className="card-kid p-4 shrink-0 flex flex-col border-l-4 border-l-gta-primary">
          <h2 className="font-bold text-base mb-2 text-gta-text">Salat course progress</h2>
          <SalatProgressWidget />
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          <div className="flex flex-col gap-4 min-h-0">
            <section className="card-kid p-4 min-h-0 flex flex-col">
              <h2 className="font-bold text-base mb-2 text-gta-text">Upcoming events</h2>
              <div className="min-h-0">
                <EventsWidget limit={2} />
              </div>
              <Link href="/events" className="link-kid text-sm mt-1 inline-block">View all events</Link>
            </section>
            <section className="card-kid p-4 min-h-0 flex flex-col">
              <h2 className="font-bold text-base mb-2 text-gta-text">Homework due</h2>
              <div className="min-h-0">
                <HomeworkDueWidget limit={3} />
              </div>
              <Link href="/homework" className="link-kid text-sm mt-1 inline-block">View all homework</Link>
            </section>
            <section className="card-kid p-4 min-h-0 flex flex-col">
              <h2 className="font-bold text-base mb-2 text-gta-text">Lesson activities</h2>
              <div className="min-h-0">
                <LessonActivitiesWidget limit={3} />
              </div>
              <Link href="/lessons" className="link-kid text-sm mt-1 inline-block">View all lessons</Link>
            </section>
          </div>
          <div className="flex flex-col gap-4 min-h-0">
            <section className="card-kid p-4 min-h-0 flex flex-col">
              <h2 className="font-bold text-base mb-2 text-gta-text">Leaderboard (Top 5)</h2>
              <div className="min-h-0">
                <LeaderboardWidget limit={5} />
              </div>
              <Link href="/leaderboard" className="link-kid text-sm mt-1 inline-block">Full leaderboard</Link>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-5">
      <h1 className="text-2xl font-bold mb-6 text-gta-text tracking-tight">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card-kid p-5">
          <h2 className="font-bold text-lg mb-3 text-gta-text">Upcoming events</h2>
          <EventsWidget />
          <Link href="/events" className="link-kid text-sm mt-2 inline-block">View all events</Link>
        </section>
        <section className="card-kid p-5">
          <h2 className="font-bold text-lg mb-3 text-gta-text">Leaderboard (Top 25)</h2>
          <LeaderboardWidget />
          <Link href="/leaderboard" className="link-kid text-sm mt-2 inline-block">Full leaderboard</Link>
        </section>
      </div>
      {(session.user.role === "local_nazim" || session.user.role === "regional_nazim" || session.user.role === "admin") && submissionsToMark.length > 0 && (
        <section className="card-kid p-5 mt-6">
          <h2 className="font-bold text-lg mb-3 text-gta-text">Submissions to mark</h2>
          <ul className="space-y-2">
            {submissionsToMark.map((h) => (
              <li key={h.id}>
                <Link href={`/homework/${h.id}/submissions`} className="link-kid">
                  {h.title}
                </Link>
                <span className="ml-2 text-sm text-gta-textSecondary">({h.pendingCount} pending)</span>
              </li>
            ))}
          </ul>
          <Link href="/homework" className="link-kid text-sm mt-2 inline-block">View all homework</Link>
        </section>
      )}
    </div>
  );
}
