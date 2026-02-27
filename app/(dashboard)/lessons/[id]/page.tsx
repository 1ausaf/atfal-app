import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { LessonContent } from "./lesson-content";

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: activity } = await supabase.from("lesson_activities").select("*").eq("id", id).single();
  if (!activity) notFound();
  const { data: questions } = await supabase
    .from("lesson_questions")
    .select("*")
    .eq("activity_id", id)
    .order("order", { ascending: true });
  let existingSubmission: { status: string; points_awarded: number } | null = null;
  if (session.user.role === "tifl") {
    const { data: sub } = await supabase
      .from("lesson_submissions")
      .select("status, points_awarded")
      .eq("activity_id", id)
      .eq("user_id", session.user.id)
      .single();
    existingSubmission = sub;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/lessons" className="text-green-600 hover:underline mb-4 inline-block">Back to lessons</Link>
      <h1 className="text-2xl font-bold">{activity.title}</h1>
      {activity.description && <p className="mt-2 text-slate-600 dark:text-slate-400">{activity.description}</p>}
      <LessonContent
        activity={activity}
        questions={questions ?? []}
        existingSubmission={existingSubmission}
        isTifl={session.user.role === "tifl"}
      />
    </div>
  );
}
