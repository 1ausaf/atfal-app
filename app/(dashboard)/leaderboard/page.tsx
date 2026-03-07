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
    .select("id, name, member_code, age, age_group, majlis_id, total_points, salat_star, salat_superstar")
    .eq("age_group", currentGroup)
    .order("total_points", { ascending: false })
    .limit(100);

  const { data: majlis } = await supabase.from("majlis").select("id, name");
  const majlisMap = new Map((majlis ?? []).map((m) => [m.id, m.name]));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gta-text">Leaderboard</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {AGE_GROUPS.map((g) => (
          <Link
            key={g.value}
            href={`/leaderboard?age_group=${g.value}`}
            className={`px-4 py-2 rounded-gta-sm text-sm font-semibold transition-colors ${
              currentGroup === g.value
                ? "bg-gta-primary text-[#1a2e0a]"
                : "bg-gta-surfaceSecondary text-gta-text hover:bg-gta-border"
            }`}
          >
            {g.label}
          </Link>
        ))}
      </div>
      <div className="card-kid overflow-hidden p-0">
        {!rows?.length ? (
          <p className="p-6 text-gta-textSecondary">No scores in this group yet.</p>
        ) : (
          <ol className="divide-y divide-gta-border">
            {rows.map((r, i) => {
              const row = r as { salat_star?: boolean; salat_superstar?: boolean; member_code?: string };
              const showSuperstar = row.salat_superstar === true;
              const showStar = !showSuperstar && row.salat_star === true;
              return (
                <li key={r.id} className="flex justify-between items-center gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <span className="font-bold text-gta-text">
                      {i + 1}. {r.name ?? "—"}
                      {showSuperstar && (
                        <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500 text-white">
                          Salat Superstar
                        </span>
                      )}
                      {showStar && (
                        <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-300 text-purple-900">
                          Salat Star
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-gta-textSecondary">
                      @{row.member_code ?? "—"}
                    </span>
                  </div>
                  <span className="text-sm text-gta-textSecondary shrink-0">
                    Age {r.age ?? "—"} · {r.majlis_id ? majlisMap.get(r.majlis_id) : "—"}
                  </span>
                  <span className="font-bold text-gta-primary shrink-0">{r.total_points} pts</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
