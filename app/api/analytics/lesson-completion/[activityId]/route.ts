import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ activityId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Regional Nazim or Admin only" }, { status: 403 });

  const { activityId } = await params;

  const supabase = createSupabaseServerClient();

  const { data: activity, error: activityError } = await supabase
    .from("lesson_activities")
    .select("id, title")
    .eq("id", activityId)
    .single();

  if (activityError || !activity)
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });

  const { data: questions, error: questionsError } = await supabase
    .from("lesson_questions")
    .select("id, question_text, question_type, options, points_value")
    .eq("activity_id", activityId)
    .order("order", { ascending: true });

  if (questionsError) return NextResponse.json({ error: questionsError.message }, { status: 500 });

  const { data: submissions, error: submissionsError } = await supabase
    .from("lesson_submissions")
    .select("id, user_id, answers, status, auto_points, points_awarded, created_at")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: false });

  if (submissionsError) return NextResponse.json({ error: submissionsError.message }, { status: 500 });

  const userIds = Array.from(new Set((submissions ?? []).map((s) => s.user_id)));
  let users: { id: string; name: string | null; member_code?: string }[] = [];
  if (userIds.length > 0) {
    const res = await supabase.from("users").select("id, name, member_code").in("id", userIds);
    users = res.data ?? [];
  }

  const userMap = new Map(users.map((u) => [u.id, { name: u.name ?? null, member_code: u.member_code ?? null }]));

  const submissionsWithUser = (submissions ?? []).map((s) => ({
    id: s.id,
    user_id: s.user_id,
    name: userMap.get(s.user_id)?.name ?? null,
    member_code: userMap.get(s.user_id)?.member_code ?? null,
    answers: s.answers,
    status: s.status,
    auto_points: (s as { auto_points?: number }).auto_points ?? 0,
    points_awarded: s.points_awarded ?? 0,
    created_at: s.created_at,
  }));

  return NextResponse.json({
    activity: { id: activity.id, title: activity.title },
    questions: questions ?? [],
    submissions: submissionsWithUser,
  });
}
