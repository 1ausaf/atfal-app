import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";

const TOTAL = 14;
const CIRCLE = 2 * Math.PI * 15.5;

export default async function SalatHubPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "tifl") redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const [categoriesRes, progressRes] = await Promise.all([
    supabase.from("salat_categories").select("id, order, title").order("order", { ascending: true }),
    supabase.from("salat_progress").select("category_id, status, passed_arabic, passed_translation").eq("user_id", session.user.id),
  ]);
  const categories = categoriesRes.data ?? [];
  const progressByCategory = new Map(
    (progressRes.data ?? []).map((p) => [
      p.category_id,
      { status: p.status, passed_arabic: p.passed_arabic === true, passed_translation: p.passed_translation === true },
    ])
  );
  const arabicCount = [...progressByCategory.values()].filter((p) => p.passed_arabic).length;
  const translationCount = [...progressByCategory.values()].filter((p) => p.passed_translation).length;

  return (
    <div className="max-w-4xl mx-auto">
      <section>
        <h1 className="text-3xl font-bold mb-2 text-slate-800 dark:text-slate-200">Salat Course</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Arabic: <strong className="text-emerald-600 dark:text-emerald-400">{arabicCount}/{TOTAL}</strong>
          {" · "}
          Translation: <strong className="text-amber-600 dark:text-amber-400">{translationCount}/{TOTAL}</strong>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const prog = progressByCategory.get(cat.id) ?? { status: "not_started", passed_arabic: false, passed_translation: false };
            const isReady = prog.status === "ready_for_test";
            const arabicFill = prog.passed_arabic ? 100 : isReady ? 50 : 0;
            const translationFill = prog.passed_translation ? 100 : prog.passed_arabic ? 0 : 0;
            return (
              <Link
                key={cat.id}
                href={`/learn/salat/${cat.id}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-emerald-800/50 bg-[var(--salat-card)] dark:bg-[var(--salat-card)] shadow-card hover:shadow-card-hover hover:border-emerald-400 dark:hover:border-emerald-500 hover:scale-[1.02] transition-all duration-200"
              >
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-14 h-14 -rotate-90 absolute" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-200 dark:text-slate-600" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray={CIRCLE}
                      strokeDashoffset={CIRCLE - (CIRCLE * arabicFill) / 100}
                      className={prog.passed_arabic ? "text-emerald-500" : isReady ? "text-amber-500" : "text-slate-300 dark:text-slate-500"}
                      strokeLinecap="round"
                    />
                  </svg>
                  <svg className="w-14 h-14 -rotate-90 absolute" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-200/80 dark:text-slate-600/80" />
                    <circle
                      cx="18"
                      cy="18"
                      r="11"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeDasharray={2 * Math.PI * 11}
                      strokeDashoffset={2 * Math.PI * 11 - ((2 * Math.PI * 11) * translationFill) / 100}
                      className={prog.passed_translation ? "text-amber-400" : "text-amber-200/60 dark:text-amber-900/40"}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {cat.order}
                  </span>
                </div>
                <span className="text-xs font-medium text-center text-slate-600 dark:text-slate-400 line-clamp-2">
                  {cat.title}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
