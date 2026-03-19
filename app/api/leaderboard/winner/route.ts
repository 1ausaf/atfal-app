import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseServerClient();

  const { data: winnerRow, error: winnerError } = await supabase
    .from("leaderboard")
    .select("id, name, age, majlis_id, total_points")
    .order("total_points", { ascending: false })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (winnerError) return NextResponse.json({ error: winnerError.message }, { status: 500 });
  if (!winnerRow) return NextResponse.json({ winner: null });

  const [{ count: totalLessonsCount }, submissionsRes] = await Promise.all([
    supabase.from("lesson_activities").select("*", { count: "exact", head: true }),
    supabase
      .from("lesson_submissions")
      .select("activity_id, points_awarded")
      .eq("user_id", winnerRow.id),
  ]);

  // Keep winner display resilient: stats can gracefully degrade to 0%,
  // but winner identity/points should still be returned.
  const submissions = submissionsRes.error ? [] : (submissionsRes.data ?? []);
  const submittedActivityIds = Array.from(new Set(submissions.map((s) => s.activity_id)));
  const completedLessonsCount = submittedActivityIds.length;

  const lessonsCompletedPct =
    (totalLessonsCount ?? 0) > 0 ? (completedLessonsCount / (totalLessonsCount ?? 0)) * 100 : 0;

  let totalPossibleOnSubmitted = 0;
  if (submittedActivityIds.length > 0) {
    const { data: questions, error: questionsError } = await supabase
      .from("lesson_questions")
      .select("activity_id, points_value")
      .in("activity_id", submittedActivityIds);

    const possibleByActivity = new Map<string, number>();
    // Older databases may not have points_value; fallback to 1 point/question.
    if (!questionsError) {
      (questions ?? []).forEach((q) => {
        const points = q.points_value ?? 1;
        possibleByActivity.set(q.activity_id, (possibleByActivity.get(q.activity_id) ?? 0) + points);
      });
    } else {
      const { data: fallbackQuestions } = await supabase
        .from("lesson_questions")
        .select("activity_id")
        .in("activity_id", submittedActivityIds);
      (fallbackQuestions ?? []).forEach((q) => {
        possibleByActivity.set(q.activity_id, (possibleByActivity.get(q.activity_id) ?? 0) + 1);
      });
    }

    submittedActivityIds.forEach((activityId) => {
      totalPossibleOnSubmitted += possibleByActivity.get(activityId) ?? 0;
    });
  }

  const totalScoredOnSubmitted = submissions.reduce((sum, s) => sum + (s.points_awarded ?? 0), 0);
  const averageMarksPct =
    totalPossibleOnSubmitted > 0 ? (totalScoredOnSubmitted / totalPossibleOnSubmitted) * 100 : 0;

  let majlisName: string | null = null;
  if (winnerRow.majlis_id) {
    const { data: majlis, error: majlisError } = await supabase
      .from("majlis")
      .select("name")
      .eq("id", winnerRow.majlis_id)
      .maybeSingle();
    majlisName = majlisError ? null : (majlis?.name ?? null);
  }

  return NextResponse.json({
    winner: {
      id: winnerRow.id,
      name: winnerRow.name ?? null,
      age: winnerRow.age ?? null,
      majlis: majlisName,
      points: winnerRow.total_points ?? 0,
      lessonsCompletedPct,
      averageMarksPct,
    },
  });
}
