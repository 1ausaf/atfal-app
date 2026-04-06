import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { recordMajlisCompetitionContribution } from "@/lib/majlis-competition";
import {
  getActiveSeasonStartIso,
  incrementUserSeason2Points,
  isLessonSeasonEligibleByCutoff,
} from "@/lib/season-points";

function getSalatLessonMultiplier(user: { salat_star?: boolean; salat_superstar?: boolean } | null): number {
  if (!user) return 0;
  if (user.salat_superstar === true) return 0.25;
  if (user.salat_star === true) return 0.1;
  return 0;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl") return NextResponse.json({ error: "Only Tifls can submit lessons" }, { status: 403 });

  const { id: activityId } = await params;
  const body = await request.json();
  const answers = body.answers;
  if (!answers || typeof answers !== "object") return NextResponse.json({ error: "answers required" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: activity } = await supabase
    .from("lesson_activities")
    .select("id, target_age_groups, created_at")
    .eq("id", activityId)
    .single();
  if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  const { data: profile } = await supabase
    .from("users")
    .select("age_group")
    .eq("id", session.user.id)
    .maybeSingle();
  const tiflAgeGroup = profile?.age_group;
  const targetAgeGroups = Array.isArray(activity.target_age_groups) ? (activity.target_age_groups as string[]) : ["all"];
  if (!(targetAgeGroups.includes("all") || (tiflAgeGroup != null && targetAgeGroups.includes(tiflAgeGroup)))) {
    return NextResponse.json({ error: "This lesson is not assigned to your age group" }, { status: 403 });
  }

  const { data: questions } = await supabase
    .from("lesson_questions")
    .select("id, question_type, options, points_value")
    .eq("activity_id", activityId)
    .order("order", { ascending: true });

  const answersMap = answers as Record<string, string>;
  let autoPoints = 0;
  let hasLongAnswer = false;
  for (const q of questions ?? []) {
    if (q.question_type === "long_answer") {
      hasLongAnswer = true;
      continue;
    }
    if (q.question_type === "short_quiz") {
      const correct = (q.options as { correct?: string } | null)?.correct;
      const userAnswer = answersMap[q.id];
      const points = typeof (q as { points_value?: number }).points_value === "number" ? (q as { points_value: number }).points_value : 1;
      if (correct != null && correct !== "" && userAnswer === correct) {
        autoPoints += points;
      }
    }
  }

  const status = hasLongAnswer ? "pending" : "graded";
  const { data: userRow } = await supabase
    .from("users")
    .select("salat_star, salat_superstar")
    .eq("id", session.user.id)
    .single();
  const multiplier = getSalatLessonMultiplier(
    userRow as { salat_star?: boolean; salat_superstar?: boolean } | null
  );
  const bonusPoints = Math.round(autoPoints * multiplier);
  const pointsAwarded = autoPoints + bonusPoints;

  const { data, error } = await supabase
    .from("lesson_submissions")
    .insert({
      activity_id: activityId,
      user_id: session.user.id,
      answers: answers as Record<string, unknown>,
      status,
      auto_points: autoPoints,
      points_awarded: status === "graded" ? pointsAwarded : 0,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const payload = data ?? { ok: true };
  if (status === "graded" && typeof pointsAwarded === "number") {
    if (pointsAwarded > 0) {
      const activeSeasonStartIso = await getActiveSeasonStartIso(supabase);
      const isSeasonEligible = isLessonSeasonEligibleByCutoff(activity.created_at, activeSeasonStartIso);
      if (isSeasonEligible) {
        await incrementUserSeason2Points(supabase, session.user.id, pointsAwarded);
        await recordMajlisCompetitionContribution({
          userId: session.user.id,
          majlisId: session.user.majlisId,
          rawPoints: pointsAwarded,
          homeworkPoints: 0,
          eventType: "lesson",
        });
      }
    }
    return NextResponse.json({ ...payload, points_awarded: pointsAwarded });
  }
  return NextResponse.json(payload);
}
