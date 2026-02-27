import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { EventsWidget } from "@/components/events-widget";
import { LeaderboardWidget } from "@/components/leaderboard-widget";
import { HomeworkDueWidget } from "@/components/homework-due-widget";
import { LessonActivitiesWidget } from "@/components/lesson-activities-widget";
import Link from "next/link";

async function getSubmissionsToMark(role: string, majlisId: string | null) {
  if (role !== "local_nazim" && role !== "regional_nazim") return [];
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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const submissionsToMark =
    session.user.role === "local_nazim" || session.user.role === "regional_nazim"
      ? await getSubmissionsToMark(session.user.role, session.user.majlisId)
      : [];

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card p-4">
          <h2 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">Upcoming events</h2>
          <EventsWidget />
          <Link href="/events" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline mt-2 inline-block transition-colors">View all events</Link>
        </section>
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card p-4">
          <h2 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">Leaderboard (Top 25)</h2>
          <LeaderboardWidget />
          <Link href="/leaderboard" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline mt-2 inline-block transition-colors">Full leaderboard</Link>
        </section>
      </div>
      {(session.user.role === "local_nazim" || session.user.role === "regional_nazim") && submissionsToMark.length > 0 && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card p-4 mt-6">
          <h2 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">Submissions to mark</h2>
          <ul className="space-y-2">
            {submissionsToMark.map((h) => (
              <li key={h.id}>
                <Link href={`/homework/${h.id}/submissions`} className="text-emerald-600 hover:text-emerald-700 hover:underline">
                  {h.title}
                </Link>
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">({h.pendingCount} pending)</span>
              </li>
            ))}
          </ul>
          <Link href="/homework" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline mt-2 inline-block transition-colors">View all homework</Link>
        </section>
      )}
      {session.user.role === "tifl" && (
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card p-4">
            <h2 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">Homework due</h2>
            <HomeworkDueWidget />
            <Link href="/homework" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline mt-2 inline-block transition-colors">View all homework</Link>
          </section>
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card p-4">
            <h2 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">Lesson activities</h2>
            <LessonActivitiesWidget />
            <Link href="/lessons" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline mt-2 inline-block transition-colors">View all lessons</Link>
          </section>
        </div>
      )}
    </div>
  );
}
