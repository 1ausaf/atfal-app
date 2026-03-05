import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";

const AGE_GROUPS = [
  { value: "7-9", label: "Mayar e Sagheer (7-9)" },
  { value: "10-11", label: "Mayar e Sagheer (10-11)" },
  { value: "12-14", label: "Mayar e Kabeer (12-14)" },
] as const;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ age_group?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const params = await searchParams;
  const ageGroup = params.age_group ?? "7-9";
  const valid = AGE_GROUPS.some((g) => g.value === ageGroup);
  const currentGroup = valid ? ageGroup : "7-9";

  const supabase = createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("leaderboard")
    .select("id, name, member_code, age, age_group, majlis_id, total_points")
    .eq("age_group", currentGroup)
    .order("total_points", { ascending: false })
    .limit(100);

  const { data: majlis } = await supabase.from("majlis").select("id, name");
  const majlisMap = new Map((majlis ?? []).map((m) => [m.id, m.name]));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Leaderboard</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {AGE_GROUPS.map((g) => (
          <Link
            key={g.value}
            href={`/leaderboard?age_group=${g.value}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentGroup === g.value
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            }`}
          >
            {g.label}
          </Link>
        ))}
      </div>
      <div className="card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
        {!rows?.length ? (
          <p className="p-6 text-slate-500 dark:text-slate-400">No scores in this group yet.</p>
        ) : (
          <ol className="divide-y divide-slate-200 dark:divide-slate-700">
            {rows.map((r, i) => (
              <li key={r.id} className="flex justify-between items-center gap-4 px-4 py-3">
                <div className="min-w-0">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {i + 1}. {r.name ?? "—"}
                  </span>
                  <span className="block text-sm text-slate-500 dark:text-slate-400">
                    @{(r as { member_code?: string }).member_code ?? "—"}
                  </span>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400 shrink-0">
                  Age {r.age ?? "—"} · {r.majlis_id ? majlisMap.get(r.majlis_id) : "—"}
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">{r.total_points} pts</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
