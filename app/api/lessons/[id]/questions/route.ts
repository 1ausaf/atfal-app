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
  if (session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: activityId } = await params;
  const body = await request.json();
  const { question_text, question_type, order, options } = body;
  if (!question_text || !question_type) return NextResponse.json({ error: "question_text and question_type required" }, { status: 400 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lesson_questions")
    .insert({
      activity_id: activityId,
      question_text: String(question_text).trim(),
      question_type: question_type === "long_answer" ? "long_answer" : "short_quiz",
      order: typeof order === "number" ? order : 0,
      options: options ?? null,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
