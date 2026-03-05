import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function LeaderboardWidget({ limit = 10 }: { limit?: number }) {
  const session = await getServerSession(authOptions);
  if (!session) return <p className="text-gray-500">Sign in to see leaderboard.</p>;
  const supabase = createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .limit(limit);
  const { data: majlis } = await supabase.from("majlis").select("id, name");
  const majlisMap = new Map((majlis ?? []).map((m) => [m.id, m.name]));

  if (!rows?.length) return <p className="text-slate-500 dark:text-slate-400">No scores yet.</p>;
  return (
    <ol className="space-y-1">
      {rows.map((r, i) => (
        <li key={r.id} className="flex justify-between items-baseline gap-2 py-1.5 px-2 rounded-xl hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10">
          <span>
            <span className="font-medium text-slate-800 dark:text-white">{i + 1}. {r.name ?? "—"}</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              @{(r as { member_code?: string }).member_code ?? "—"}
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Age {r.age ?? "—"} · {r.majlis_id ? majlisMap.get(r.majlis_id) : "—"}
            </span>
          </span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{r.total_points} pts</span>
        </li>
      ))}
    </ol>
  );
}
