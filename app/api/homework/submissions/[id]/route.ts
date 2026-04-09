import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { recordMajlisCompetitionContribution } from "@/lib/majlis-competition";
import { getTodayToronto } from "@/lib/datetime";
import {
  getActiveSeasonStartIso,
  incrementUserSeason2Points,
  isTorontoActivityDateInActiveSeason,
} from "@/lib/season-points";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_submissions")
    .select("*, homework:homework_id(*)")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "tifl" && data.user_id !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { status, points_awarded } = body;
  if (!["approved", "rejected"].includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const supabase = createSupabaseServerClient();
  const { data: sub } = await supabase.from("homework_submissions").select("homework_id, user_id").eq("id", id).single();
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: hw } = await supabase.from("homework").select("majlis_id").eq("id", sub.homework_id).single();
  if (session.user.role === "local_nazim" && hw?.majlis_id !== session.user.majlisId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let points = Math.min(100, Math.max(0, Number(points_awarded) || 0));
  const updates: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: session.user.id,
  };
  if (status === "approved") updates.points_awarded = points;
  const { error } = await supabase.from("homework_submissions").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (status === "approved" && points > 0) {
    await recordMajlisCompetitionContribution({
      userId: (sub as { user_id: string }).user_id,
      majlisId: hw?.majlis_id ?? null,
      rawPoints: points,
      homeworkPoints: points,
      eventType: "homework",
    });
    const activeSeasonStartIso = await getActiveSeasonStartIso(supabase);
    const todayToronto = getTodayToronto();
    if (isTorontoActivityDateInActiveSeason(todayToronto, activeSeasonStartIso)) {
      await incrementUserSeason2Points(supabase, (sub as { user_id: string }).user_id, points);
    }
  }
  return NextResponse.json({ ok: true });
}
