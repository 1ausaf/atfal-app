import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

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
  const { manual_points } = body;
  const supabase = createSupabaseServerClient();
  const { data: sub } = await supabase.from("lesson_submissions").select("id, status, auto_points").eq("id", id).single();
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (sub.status === "graded") return NextResponse.json({ error: "Already graded" }, { status: 400 });
  const autoPoints = typeof (sub as { auto_points?: number }).auto_points === "number" ? (sub as { auto_points: number }).auto_points : 0;
  const manualPts = Math.max(0, Number(manual_points) ?? 0);
  const totalPoints = autoPoints + manualPts;
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
  return NextResponse.json({ ok: true });
}
