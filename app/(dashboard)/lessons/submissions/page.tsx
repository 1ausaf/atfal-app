import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { GradeSubmissionButton } from "./grade-submission-button";

export default async function LessonSubmissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim" && session.user.role !== "local_nazim") redirect("/lessons");
  const supabase = createSupabaseServerClient();
  const { data: submissions } = await supabase
    .from("lesson_submissions")
    .select("id, activity_id, user_id, answers, status, points_awarded, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  const activityIds = Array.from(new Set((submissions ?? []).map((s) => s.activity_id)));
  const userIds = Array.from(new Set((submissions ?? []).map((s) => s.user_id)));
  const { data: activities } = await supabase.from("lesson_activities").select("id, title").in("id", activityIds);
  const { data: users } = await supabase.from("users").select("id, name").in("id", userIds);
  const { data: questions } = await supabase.from("lesson_questions").select("id, activity_id, question_text, question_type").in("activity_id", activityIds);
  const activityMap = new Map((activities ?? []).map((a) => [a.id, a.title]));
  const userMap = new Map((users ?? []).map((u) => [u.id, u.name]));
  const questionsByActivity = new Map<string, { id: string; activity_id: string; question_text: string; question_type: string }[]>();
  for (const q of questions ?? []) {
    const list = questionsByActivity.get(q.activity_id) ?? [];
    list.push(q);
    questionsByActivity.set(q.activity_id, list);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/lessons" className="text-green-600 hover:underline mb-4 inline-block">Back to lessons</Link>
      <h1 className="text-2xl font-bold mb-6">Grade lesson submissions (pending)</h1>
      {!submissions?.length ? (
        <p className="text-slate-500 dark:text-slate-400">No pending submissions.</p>
      ) : (
        <ul className="space-y-6">
          {submissions.map((s) => {
            const qList = questionsByActivity.get(s.activity_id) ?? [];
            return (
              <li key={s.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{userMap.get(s.user_id) ?? s.user_id}</span>
                    <span className="mx-2">·</span>
                    <span>{activityMap.get(s.activity_id) ?? s.activity_id}</span>
                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{new Date(s.created_at).toLocaleString()}</span>
                  </div>
                  <GradeSubmissionButton submissionId={s.id} />
                </div>
                <div className="mt-3 space-y-2">
                  {qList.map((q) => (
                    <div key={q.id}>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{q.question_text}</p>
                      <p className="text-sm">{String((s.answers as Record<string, string>)?.[q.id] ?? "—")}</p>
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
