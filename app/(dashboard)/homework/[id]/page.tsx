import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { formatDateTimeInToronto } from "@/lib/datetime";
import Link from "next/link";
import { SubmitHomeworkButton } from "./submit-homework-button";

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: hw } = await supabase.from("homework").select("*").eq("id", id).single();
  if (!hw) notFound();
  if (session.user.role === "tifl") {
    if (hw.majlis_id != null && hw.majlis_id !== session.user.majlisId) notFound();
    if (hw.release_at != null && new Date(hw.release_at) > new Date()) notFound();
  }
  if (session.user.role === "local_nazim" && hw.majlis_id !== session.user.majlisId) notFound();

  let linkedLessonTitle: string | null = null;
  if (hw.lesson_activity_id) {
    const { data: lesson } = await supabase.from("lesson_activities").select("id, title").eq("id", hw.lesson_activity_id).single();
    linkedLessonTitle = lesson?.title ?? null;
  }

  let existingSubmission: { id: string; status: string } | null = null;
  if (session.user.role === "tifl") {
    const { data: sub } = await supabase
      .from("homework_submissions")
      .select("id, status")
      .eq("homework_id", id)
      .eq("user_id", session.user.id)
      .single();
    existingSubmission = sub;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/homework" className="text-green-600 hover:underline mb-4 inline-block">Back to homework</Link>
      <article className="card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-800 shadow-lg p-6">
        <h1 className="text-2xl font-bold">{hw.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Due: {formatDateTimeInToronto(hw.due_by)}</p>
        {(session.user.role === "local_nazim" || session.user.role === "regional_nazim" || session.user.role === "admin") && hw.release_at != null && new Date(hw.release_at) > new Date() && (
          <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">Private until {formatDateTimeInToronto(hw.release_at)}</p>
        )}
        {linkedLessonTitle && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Linked lesson: <Link href={`/lessons/${hw.lesson_activity_id}`} className="text-green-600 hover:underline">{linkedLessonTitle}</Link>
          </p>
        )}
        {hw.description && <p className="mt-4 text-slate-600 dark:text-slate-400">{hw.description}</p>}
        {hw.links?.length > 0 && (
          <ul className="mt-4 space-y-1">
            {hw.links.map((url: string, i: number) => (
              <li key={i}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        )}
        {session.user.role === "tifl" && (
          <div className="mt-6">
            {existingSubmission ? (
              <p className="text-slate-600 dark:text-slate-400">Status: <span className="font-medium">{existingSubmission.status}</span></p>
            ) : (
              <SubmitHomeworkButton homeworkId={id} />
            )}
          </div>
        )}
        {(session.user.role === "local_nazim" || session.user.role === "regional_nazim" || session.user.role === "admin") && (
          <div className="mt-6 flex flex-wrap gap-4">
            {((session.user.role === "regional_nazim" || session.user.role === "admin") || (session.user.role === "local_nazim" && hw.majlis_id === session.user.majlisId)) && (
              <Link href={`/homework/${id}/edit`} className="text-green-600 hover:underline">
                Edit
              </Link>
            )}
            <Link href={`/homework/${id}/submissions`} className="text-green-600 hover:underline">
              View submissions
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
