import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";

const TOTAL = 14;

// Regular pentagon: center (50,50), "top" at (50, 5). Radius ~45.
// Points clockwise from top: (50,5), (93.5,35.5), (75.5,85.5), (24.5,85.5), (6.5,35.5)
const PENTAGON_OUTER = "M 50 5 L 93.5 35.5 L 75.5 85.5 L 24.5 85.5 L 6.5 35.5 Z";
// Inner pentagon: radius ~28 from center (50,50). Top (50,22), then clockwise.
const PENTAGON_INNER = "M 50 22 L 77 37 L 65.8 72.1 L 34.2 72.1 L 23 37 Z";

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
    <div className="space-y-2 max-h-[180px] flex flex-col">
      <div className="flex items-center justify-center gap-4 shrink-0">
        {/* Pentagon SVG: outer = translation (gold), inner = Arabic (emerald), center = X/14 */}
        <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden>
            {/* Outer pentagon: translation progress (gold stroke) */}
            <path
              d={PENTAGON_OUTER}
              fill="none"
              stroke="rgb(245 158 11 / 0.25)"
              strokeWidth="8"
              pathLength={100}
              strokeDasharray={`${translationPct} 100`}
              className="transition-all duration-300"
            />
            {/* Inner pentagon: Arabic progress (emerald stroke) */}
            <path
              d={PENTAGON_INNER}
              fill="none"
              stroke="rgb(16 185 129 / 0.4)"
              strokeWidth="6"
              pathLength={100}
              strokeDasharray={`${arabicPct} 100`}
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-slate-800 dark:text-white tabular-nums">
              {arabicCount}/{TOTAL}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                salatStar ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
              title="Pass all 14 sections in Arabic only"
            >
              Salat Star
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                salatSuperstar ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200" : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
              title="Pass all 14 in Arabic and with Translation"
            >
              Salat Superstar
            </span>
          </div>
          <Link href="/learn/salat" className="link-kid text-sm inline-block">
            Go to Salat course
          </Link>
          {(salatStar || salatSuperstar) && (
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              +100 bonus on homework and lessons.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
