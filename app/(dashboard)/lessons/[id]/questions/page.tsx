import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { AddQuestionForm } from "./add-question-form";

export default async function LessonQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim") redirect("/lessons");
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: activity } = await supabase.from("lesson_activities").select("*").eq("id", id).single();
  if (!activity) notFound();
  const { data: questions } = await supabase
    .from("lesson_questions")
    .select("*")
    .eq("activity_id", id)
    .order("order", { ascending: true });

  return (
    <div className="max-w-2xl mx-auto">
      <Link href={`/lessons/${id}`} className="text-green-600 hover:underline mb-4 inline-block">Back to lesson</Link>
      <h1 className="text-2xl font-bold mb-2">Questions: {activity.title}</h1>
      <AddQuestionForm activityId={id} />
      <ul className="mt-6 space-y-3">
        {(questions ?? []).map((q) => (
          <li key={q.id} className="rounded-lg border p-3">
            <span className="font-medium">{q.question_text}</span>
            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">({q.question_type})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
