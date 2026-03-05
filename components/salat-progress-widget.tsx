import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";

const TOTAL = 14;

export async function SalatProgressWidget() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") return null;

  const supabase = createSupabaseServerClient();
  const [progressRes, userRes] = await Promise.all([
    supabase.from("salat_progress").select("passed_arabic, passed_translation").eq("user_id", session.user.id),
    supabase.from("users").select("salat_star, salat_superstar").eq("id", session.user.id).single(),
  ]);
  const list = progressRes.data ?? [];
  const arabicCount = list.filter((p) => p.passed_arabic === true).length;
  const translationCount = list.filter((p) => p.passed_translation === true).length;
  const salatStar = (userRes.data as { salat_star?: boolean } | null)?.salat_star === true;
  const salatSuperstar = (userRes.data as { salat_superstar?: boolean } | null)?.salat_superstar === true;

  const arabicPct = Math.round((arabicCount / TOTAL) * 100);
  const translationPct = Math.round((translationCount / TOTAL) * 100);

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
        <span>Arabic: {arabicCount}/{TOTAL}</span>
        <span>Translation: {translationCount}/{TOTAL}</span>
      </div>
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${arabicPct}%` }}
          />
        </div>
        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-400 transition-all duration-300"
            style={{ width: `${translationPct}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-xs text-slate-500 dark:text-slate-400">Goals:</span>
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              salatStar ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            }`}
            title="Pass all 14 sections in Arabic only"
          >
            Salat Star
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              salatSuperstar ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
            }`}
            title="Pass all 14 in Arabic and with Translation"
          >
            Salat Superstar
          </span>
        </div>
      </div>
      {(salatStar || salatSuperstar) && (
        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
          You earn +100 bonus points on every homework and lesson you complete.
        </p>
      )}
      <Link href="/learn/salat" className="link-kid text-sm mt-2 inline-block">
        Go to Salat course
      </Link>
    </div>
  );
}
