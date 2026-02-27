import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { SubmitHomeworkButton } from "./submit-homework-button";

export default async function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: hw } = await supabase.from("homework").select("*").eq("id", id).single();
  if (!hw) notFound();
  if (session.user.role === "tifl" && hw.majlis_id !== session.user.majlisId) notFound();
  if (session.user.role === "local_nazim" && hw.majlis_id !== session.user.majlisId) notFound();

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
      <article className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card p-6">
        <h1 className="text-2xl font-bold">{hw.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Due: {new Date(hw.due_by).toLocaleString()}</p>
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
        {(session.user.role === "local_nazim" || session.user.role === "regional_nazim") && (
          <Link href={`/homework/${id}/submissions`} className="mt-6 inline-block text-green-600 hover:underline">
            View submissions
          </Link>
        )}
      </article>
    </div>
  );
}
