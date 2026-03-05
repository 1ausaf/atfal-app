import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; questionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: activityId, questionId } = await params;
  const body = await request.json();
  const { points_value, question_text, options } = body;

  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("lesson_questions")
    .select("id")
    .eq("id", questionId)
    .eq("activity_id", activityId)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (typeof points_value === "number" && points_value >= 0) {
    updates.points_value = points_value;
  }
  if (question_text !== undefined) {
    updates.question_text = String(question_text).trim();
  }
  if (options !== undefined) {
    updates.options = options;
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { error } = await supabase
    .from("lesson_questions")
    .update(updates)
    .eq("id", questionId)
    .eq("activity_id", activityId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
