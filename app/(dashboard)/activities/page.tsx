import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function ActivitiesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const isTifl = session.user.role === "tifl";

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Activities</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Play games and explore additional learning activities.
      </p>
      <section className="mb-8">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 mb-3">GAMES</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/activities/wordle"
            className="card-kid p-6 transition-colors hover:shadow-gta-hover"
          >
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">WORDLE</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Guess the word in 6 tries.</p>
          </Link>
          <Link
            href="/activities/crossword"
            className="card-kid p-6 transition-colors hover:shadow-gta-hover"
          >
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Crossword</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Daily puzzle; first solve earns 50 points (Tifl).</p>
          </Link>
          <Link
            href="/activities/worldguessr"
            className="card-kid p-6 transition-colors hover:shadow-gta-hover"
          >
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">WorldGuessr</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Explore maps and play with friends to guess the location!
            </p>
          </Link>
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400 mb-3">MORE ACTIVITIES</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {isTifl && (
            <Link
              href="/activities/letter-to-huzoor"
              className="card-kid p-6 transition-all hover:shadow-gta-hover ring-1 ring-amber-400/20 hover:ring-amber-400/40"
            >
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Letter to Huzoor</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Type your letter to Huzoor and submit it.
              </p>
            </Link>
          )}
          <Link
            href="/activities/read"
            className="card-kid p-6 transition-colors hover:shadow-gta-hover"
          >
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Read</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Newsletter and reading content</p>
          </Link>
          <Link
            href="/activities/ijtima"
            className="card-kid p-6 transition-all hover:shadow-gta-hover ring-1 ring-amber-400/20 hover:ring-amber-400/40 shadow-[0_0_22px_rgba(251,191,36,0.18)] hover:shadow-[0_0_34px_rgba(251,191,36,0.28)]"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-xl p-2 bg-amber-500/10 ring-1 ring-amber-400/25 shadow-[0_0_18px_rgba(251,191,36,0.22)]">
                <svg
                  viewBox="0 0 24 24"
                  className="w-7 h-7 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">IJTIMA</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  View your Mayar syllabus PDF.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
