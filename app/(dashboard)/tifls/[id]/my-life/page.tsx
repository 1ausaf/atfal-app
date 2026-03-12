import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getMyLifeSummaryForTifl } from "@/lib/my-life-summary";
import Link from "next/link";

export default async function TiflMyLifePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim" && session.user.role !== "admin") {
    redirect("/dashboard");
  }
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: tifl } = await supabase
    .from("users")
    .select("id, name, majlis_id")
    .eq("id", id)
    .eq("role", "tifl")
    .single();
  if (!tifl) return <p className="text-gta-textSecondary dark:text-slate-400">Tifl not found.</p>;
  if (session.user.role === "local_nazim" && session.user.majlisId !== tifl.majlis_id) {
    return <p className="text-gta-textSecondary dark:text-slate-400">You don&apos;t have access to this tifl.</p>;
  }
  const summary = await getMyLifeSummaryForTifl(supabase, id);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link href="/tifls" className="link-kid text-sm">
        ← Back to Tifls
      </Link>
      <h1 className="text-xl font-bold text-gta-text dark:text-slate-100">
        My Life summary – {summary?.name ?? tifl.name ?? "Tifl"}
      </h1>
      <p className="text-sm text-gta-textSecondary dark:text-slate-400">
        Use this to have encouraging conversations and support. This is not for punishment.
      </p>
      {!summary ? (
        <p className="text-gta-textSecondary dark:text-slate-400">No My Life data yet.</p>
      ) : (
        <div className="card-kid p-5 space-y-4">
          {summary.streaks && summary.streaks.length > 0 && (
            <section>
              <h3 className="font-semibold text-gta-text dark:text-slate-100 mb-2">Current streaks</h3>
              <ul className="text-sm text-gta-text dark:text-slate-200">
                {summary.streaks.map((s: { label: string; streak: number }) => (
                  <li key={s.label}>{s.label}: {s.streak} day{s.streak !== 1 ? "s" : ""}</li>
                ))}
              </ul>
            </section>
          )}
          {summary.recentMoods && summary.recentMoods.length > 0 && (
            <section>
              <h3 className="font-semibold text-gta-text dark:text-slate-100 mb-2">Recent check-in moods</h3>
              <ul className="text-sm text-gta-text dark:text-slate-200">
                {summary.recentMoods.slice(0, 5).map((m: { date: string; mood: string }) => (
                  <li key={m.date}>{m.date}: {m.mood}</li>
                ))}
              </ul>
            </section>
          )}
          {summary.goals && summary.goals.length > 0 && (
            <section>
              <h3 className="font-semibold text-gta-text dark:text-slate-100 mb-2">Active goals</h3>
              <ul className="text-sm text-gta-text dark:text-slate-200">
                {summary.goals.map((g: { title: string; current_value: number; target_value: number | null }) => (
                  <li key={g.title}>
                    {g.title} {g.target_value != null ? `(${g.current_value}/${g.target_value})` : ""}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {summary.badges && summary.badges.length > 0 && (
            <section>
              <h3 className="font-semibold text-gta-text dark:text-slate-100 mb-2">Badges earned</h3>
              <p className="text-sm text-gta-text dark:text-slate-200">{summary.badges.join(", ")}</p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
