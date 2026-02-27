import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { ApproveSubmissionButtons } from "./approve-submission-buttons";

export default async function HomeworkSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim") redirect("/homework");
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: hw } = await supabase.from("homework").select("*").eq("id", id).single();
  if (!hw) notFound();
  if (session.user.role === "local_nazim" && hw.majlis_id !== session.user.majlisId) notFound();

  const { data: submissions } = await supabase
    .from("homework_submissions")
    .select("id, user_id, status, submitted_at, points_awarded")
    .eq("homework_id", id)
    .order("submitted_at", { ascending: false });
  const userIds = Array.from(new Set((submissions ?? []).map((s) => s.user_id)));
  const { data: users } = await supabase.from("users").select("id, name").in("id", userIds);
  const userMap = new Map((users ?? []).map((u) => [u.id, u.name]));

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/homework/${id}`} className="text-green-600 hover:underline mb-4 inline-block">Back to homework</Link>
      <h1 className="text-2xl font-bold mb-2">Submissions: {hw.title}</h1>
      {!submissions?.length ? (
        <p className="text-slate-500 dark:text-slate-400">No submissions yet.</p>
      ) : (
        <ul className="space-y-4">
          {submissions.map((s) => (
            <li key={s.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card p-4 flex justify-between items-center">
              <div>
                <span className="font-medium">{userMap.get(s.user_id) ?? s.user_id}</span>
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{new Date(s.submitted_at).toLocaleString()}</span>
                <span className="ml-2 px-2 py-0.5 rounded text-sm bg-slate-200 dark:bg-slate-600">{s.status}</span>
                {s.status === "approved" && <span className="ml-2 text-emerald-600 dark:text-emerald-400">{s.points_awarded} pts</span>}
              </div>
              {s.status === "pending" && (
                <ApproveSubmissionButtons submissionId={s.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
