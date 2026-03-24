import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { recordMajlisCompetitionContribution } from "@/lib/majlis-competition";

function getSalatLessonMultiplier(user: { salat_star?: boolean; salat_superstar?: boolean } | null): number {
  if (!user) return 0;
  if (user.salat_superstar === true) return 0.25;
  if (user.salat_star === true) return 0.1;
  return 0;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "local_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { manual_points, points_awarded: pointsAwardedOverride } = body;
  const supabase = createSupabaseServerClient();
  const isRegionalOrAdmin = session.user.role === "regional_nazim" || session.user.role === "admin";
  const { data: sub } = await supabase.from("lesson_submissions").select("id, status, auto_points, user_id").eq("id", id).single();
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (typeof pointsAwardedOverride === "number" && isRegionalOrAdmin) {
    const basePoints = Math.max(0, Math.floor(pointsAwardedOverride));
    const { data: userBadgeRow } = await supabase
      .from("users")
      .select("salat_star, salat_superstar, majlis_id")
      .eq("id", (sub as { user_id: string }).user_id)
      .maybeSingle();
    const multiplier = getSalatLessonMultiplier(
      userBadgeRow as { salat_star?: boolean; salat_superstar?: boolean } | null
    );
    const points = basePoints + Math.round(basePoints * multiplier);
    const { data: userRow } = await supabase.from("users").select("majlis_id").eq("id", (sub as { user_id: string }).user_id).maybeSingle();
    const { error } = await supabase
      .from("lesson_submissions")
      .update({
        points_awarded: points,
        status: "graded",
        graded_by: session.user.id,
        graded_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (points > 0) {
      await recordMajlisCompetitionContribution({
        userId: (sub as { user_id: string }).user_id,
        majlisId: userRow?.majlis_id ?? null,
        rawPoints: points,
        homeworkPoints: 0,
        eventType: "lesson",
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (sub.status === "graded") return NextResponse.json({ error: "Already graded" }, { status: 400 });
  const autoPoints = typeof (sub as { auto_points?: number }).auto_points === "number" ? (sub as { auto_points: number }).auto_points : 0;
  const manualPts = Math.max(0, Number(manual_points) ?? 0);
  const basePoints = autoPoints + manualPts;
  const { data: u } = await supabase
    .from("users")
    .select("salat_star, salat_superstar")
    .eq("id", (sub as { user_id: string }).user_id)
    .single();
  const multiplier = getSalatLessonMultiplier(u as { salat_star?: boolean; salat_superstar?: boolean } | null);
  const totalPoints = basePoints + Math.round(basePoints * multiplier);
  const { data: userRow } = await supabase.from("users").select("majlis_id").eq("id", (sub as { user_id: string }).user_id).maybeSingle();
  const { error } = await supabase
    .from("lesson_submissions")
    .update({
      status: "graded",
      points_awarded: totalPoints,
      graded_by: session.user.id,
      graded_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (totalPoints > 0) {
    await recordMajlisCompetitionContribution({
      userId: (sub as { user_id: string }).user_id,
      majlisId: userRow?.majlis_id ?? null,
      rawPoints: totalPoints,
      homeworkPoints: 0,
      eventType: "lesson",
    });
  }
  return NextResponse.json({ ok: true });
}
