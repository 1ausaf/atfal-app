import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";

const TOTAL = 14;

/** 0% red, 50% yellow, 100% green; interpolates in between so the whole bar is one color by progress. */
function getProgressBarColor(pct: number): string {
  if (pct <= 0) return "rgb(239, 68, 68)";
  if (pct >= 100) return "rgb(34, 197, 94)";
  if (pct <= 50) {
    const t = pct / 50;
    const r = Math.round(239 + (234 - 239) * t);
    const g = Math.round(68 + (179 - 68) * t);
    const b = Math.round(68 + (8 - 68) * t);
    return `rgb(${r},${g},${b})`;
  }
  const t = (pct - 50) / 50;
  const r = Math.round(234 + (34 - 234) * t);
  const g = Math.round(179 + (197 - 179) * t);
  const b = Math.round(8 + (94 - 8) * t);
  return `rgb(${r},${g},${b})`;
}

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

  const arabicPct = Math.min(100, Math.round((arabicCount / TOTAL) * 100));
  const translationPct = Math.min(100, Math.round((translationCount / TOTAL) * 100));

  return (
    <div className="space-y-2 flex flex-col">
      <div className="flex justify-between text-xs text-gta-textSecondary">
        <span>Arabic: {arabicCount}/{TOTAL}</span>
        <span>Translation: {translationCount}/{TOTAL}</span>
      </div>
      <div className="space-y-2">
        <div className="h-2 rounded-full bg-[#F0F0F0] dark:bg-slate-600 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${arabicPct}%`,
              backgroundColor: getProgressBarColor(arabicPct),
            }}
          />
        </div>
        <div className="h-2 rounded-full bg-[#F0F0F0] dark:bg-slate-600 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${translationPct}%`,
              backgroundColor: getProgressBarColor(translationPct),
            }}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-xs text-gta-textSecondary font-semibold">Goals:</span>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              salatStar ? "bg-purple-300 text-purple-900 dark:bg-purple-600 dark:text-white" : "bg-gta-surfaceSecondary text-gta-textSecondary"
            }`}
            title="Pass all 14 sections in Arabic only"
          >
            Salat Star
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              salatSuperstar ? "bg-red-500 text-white dark:bg-red-600" : "bg-gta-surfaceSecondary text-gta-textSecondary"
            }`}
            title="Pass all 14 in Arabic and with Translation"
          >
            Salat Superstar
          </span>
        </div>
      </div>
      {(salatStar || salatSuperstar) && (
        <p className="text-xs text-gta-primary font-medium">
          Lesson bonus only: Star +10%, Superstar +25%.
        </p>
      )}
      <Link href="/learn/salat" className="link-kid text-sm inline-block">
        Go to Salat course
      </Link>
    </div>
  );
}
