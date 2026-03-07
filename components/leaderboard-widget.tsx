import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function LeaderboardWidget({ limit = 10 }: { limit?: number }) {
  const session = await getServerSession(authOptions);
  if (!session) return <p className="text-gta-textSecondary">Sign in to see leaderboard.</p>;
  const supabase = createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .limit(limit);
  const { data: majlis } = await supabase.from("majlis").select("id, name");
  const majlisMap = new Map((majlis ?? []).map((m) => [m.id, m.name]));

  if (!rows?.length) return <p className="text-gta-textSecondary">No scores yet.</p>;
  return (
    <ol className="space-y-1">
      {rows.map((r, i) => {
        const row = r as { salat_star?: boolean; salat_superstar?: boolean; member_code?: string };
        const showSuperstar = row.salat_superstar === true;
        const showStar = !showSuperstar && row.salat_star === true;
        return (
          <li key={r.id} className="flex justify-between items-baseline gap-2 py-1.5 px-2 rounded-xl hover:bg-gta-surfaceSecondary/80">
            <span>
              <span className="font-bold text-gta-text">
                {i + 1}. {r.name ?? "—"}
                {showSuperstar && (
                  <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-red-500 text-white dark:bg-red-600">
                    Salat Superstar
                  </span>
                )}
                {showStar && (
                  <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-purple-300 text-purple-900 dark:bg-purple-600 dark:text-white">
                    Salat Star
                  </span>
                )}
              </span>
              <span className="block text-xs text-gta-textSecondary">
                @{row.member_code ?? "—"}
              </span>
              <span className="block text-xs text-gta-textSecondary">
                Age {r.age ?? "—"} · {r.majlis_id ? majlisMap.get(r.majlis_id) : "—"}
              </span>
            </span>
            <span className="font-bold text-gta-primary">{r.total_points} pts</span>
          </li>
        );
      })}
    </ol>
  );
}
