import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { isBeforeSeason3, getSeason3StartIso } from "@/lib/season-over";
import { getSeasonOverMajlisStandings } from "@/lib/season-over-majlis";
import { SeasonOverClient } from "@/components/season-over/season-over-client";

export default async function SeasonOverPage() {
  if (!isBeforeSeason3()) {
    redirect("/dashboard");
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "tifl") {
    redirect("/dashboard");
  }

  if (session.user.isBanned) {
    redirect("/banned");
  }

  if (!session.user.profile_completed) {
    redirect("/profile/complete");
  }

  const userId = session.user.id;
  const majlisId = session.user.majlisId;
  const supabase = createSupabaseServerClient();

  const [majlisResult, lessonsRes, hwRes, leaderboardRes] = await Promise.all([
    getSeasonOverMajlisStandings(),
    supabase
      .from("lesson_submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "graded"),
    supabase
      .from("homework_submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "approved"),
    supabase.from("leaderboard").select("season_points, all_time_points, age_group").eq("id", userId).maybeSingle(),
  ]);

  const lbRow = leaderboardRes.data;
  let ageGroupRank: number | null = null;
  if (lbRow?.age_group != null) {
    const { count } = await supabase
      .from("leaderboard")
      .select("id", { count: "exact", head: true })
      .eq("age_group", lbRow.age_group)
      .gt("season_points", lbRow.season_points ?? 0);
    ageGroupRank = (count ?? 0) + 1;
  }

  return (
    <SeasonOverClient
      season3StartIso={getSeason3StartIso()}
      displayName={session.user.name ?? "Tifl"}
      lessonsCompleted={lessonsRes.count ?? 0}
      homeworkApprovedCount={hwRes.count ?? 0}
      seasonPoints={lbRow?.season_points ?? 0}
      allTimePoints={lbRow?.all_time_points ?? 0}
      ageGroupLabel={lbRow?.age_group ?? null}
      ageGroupRank={ageGroupRank}
      majlis={majlisResult}
      highlightMajlisId={majlisId}
    />
  );
}
