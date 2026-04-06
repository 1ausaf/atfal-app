import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { ProfileForm } from "@/components/profile-form";
import Link from "next/link";
import Image from "next/image";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "tifl" && session.user.isBanned) redirect("/banned");

  const supabase = createSupabaseServerClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, name, age, age_group, majlis_id, date_of_birth, salat_star, salat_superstar, season1_points, season1_player_badge, season2_points")
    .eq("id", session.user.id)
    .single();

  if (!user) redirect("/dashboard");

  const salatStar = (user as { salat_star?: boolean }).salat_star === true;
  const salatSuperstar = (user as { salat_superstar?: boolean }).salat_superstar === true;
  const season1PlayerBadge = (user as { season1_player_badge?: boolean }).season1_player_badge === true;
  const season1Points = (user as { season1_points?: number | null }).season1_points ?? 0;
  const season2Points = (user as { season2_points?: number | null }).season2_points ?? 0;
  const { data: leaderboardRow } = await supabase
    .from("leaderboard")
    .select("all_time_points")
    .eq("id", session.user.id)
    .maybeSingle();
  const allTimePoints = Number((leaderboardRow as { all_time_points?: number } | null)?.all_time_points ?? 0);

  const { data: majlisList } = await supabase.from("majlis").select("id, name").order("name");

  return (
    <div className="max-w-md mx-auto p-4">
      <Link href="/dashboard" className="link-kid text-sm mb-4 inline-block">
        ← Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-2 text-gta-text">Profile</h1>
      {salatStar && (
        <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-purple-100 border border-purple-300 dark:bg-purple-900/40 dark:border-purple-600">
          <span className="text-purple-600 text-xl dark:text-purple-300" aria-hidden>★</span>
          <span className="font-semibold text-purple-900 dark:text-purple-200">Salat Star</span>
        </div>
      )}
      {salatSuperstar && (
        <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-red-50 border border-red-300 dark:bg-red-900/40 dark:border-red-600">
          <span className="text-red-500 text-xl dark:text-red-400" aria-hidden>★</span>
          <span className="font-semibold text-red-800 dark:text-red-200">Salat Superstar</span>
        </div>
      )}
      {season1PlayerBadge && (
        <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-amber-50 border border-amber-300 dark:bg-amber-900/40 dark:border-amber-600">
          <Image
            src="/badges/season-1-player.svg"
            alt="Season 1 Player badge"
            width={48}
            height={48}
            className="shrink-0"
          />
          <span className="font-semibold text-amber-900 dark:text-amber-200">Season 1 Player</span>
        </div>
      )}
      <div className="mb-4 p-3 rounded-lg bg-sky-50 border border-sky-300 dark:bg-sky-900/40 dark:border-sky-600">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-200">
          Season 1 points (locked)
        </p>
        <p className="text-2xl font-bold text-sky-900 dark:text-sky-100">{season1Points}</p>
      </div>
      <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-300 dark:bg-emerald-900/40 dark:border-emerald-600">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
          All-time points
        </p>
        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{allTimePoints}</p>
        <p className="text-xs text-emerald-700/80 dark:text-emerald-200/80 mt-1">
          Current season points: {season2Points}
        </p>
      </div>
      {(salatStar || salatSuperstar) && (
        <p className="text-sm text-gta-textSecondary mb-4">
          Salat Star gives +10% lesson points. Salat Superstar gives +25% lesson points.
        </p>
      )}
      <ProfileForm
        user={{
          name: user.name ?? "",
          date_of_birth: user.date_of_birth ?? "",
          majlis_id: user.majlis_id ?? "",
          age: user.age,
          age_group: user.age_group,
        }}
        majlisList={majlisList ?? []}
        canEditMajlis={session.user.role === "regional_nazim" || session.user.role === "admin"}
        readOnly={session.user.role === "tifl"}
      />
    </div>
  );
}
