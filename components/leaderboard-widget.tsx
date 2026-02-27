import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function LeaderboardWidget() {
  const session = await getServerSession(authOptions);
  if (!session) return <p className="text-gray-500">Sign in to see leaderboard.</p>;
  const supabase = createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .limit(10);
  const { data: majlis } = await supabase.from("majlis").select("id, name");
  const majlisMap = new Map((majlis ?? []).map((m) => [m.id, m.name]));

  if (!rows?.length) return <p className="text-gray-500">No scores yet.</p>;
  return (
    <ol className="space-y-1">
      {rows.map((r, i) => (
        <li key={r.id} className="flex justify-between items-baseline gap-2">
          <span>
            <span className="font-medium">{i + 1}. {r.name ?? "—"}</span>
            <sub className="block text-xs text-gray-500">
              Age {r.age ?? "—"} · {r.majlis_id ? majlisMap.get(r.majlis_id) : "—"}
            </sub>
          </span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">{r.total_points} pts</span>
        </li>
      ))}
    </ol>
  );
}
