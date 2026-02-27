import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

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
  const { data: activity } = await supabase.from("lesson_activities").select("id").eq("id", activityId).single();
  if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("lesson_submissions")
    .insert({
      activity_id: activityId,
      user_id: session.user.id,
      answers: answers as Record<string, unknown>,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? { ok: true });
}
