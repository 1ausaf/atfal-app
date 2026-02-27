import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { LessonItemActions } from "./lesson-item-actions";

export default async function LessonsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const supabase = createSupabaseServerClient();
  const { data: activities } = await supabase
    .from("lesson_activities")
    .select("id, title, description, link, type, created_at")
    .order("created_at", { ascending: false });
  const isRegional = session.user.role === "regional_nazim";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lesson activities</h1>
        {isRegional && (
          <>
            <Link href="/lessons/new" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Create lesson
            </Link>
            <Link href="/lessons/submissions" className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors">
              Grade submissions
            </Link>
          </>
        )}
      </div>
      {!activities?.length ? (
        <p className="text-slate-500 dark:text-slate-400">No lesson activities yet.</p>
      ) : (
        <ul className="space-y-4">
          {activities.map((a) => (
            <li key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <Link href={`/lessons/${a.id}`} className="font-semibold text-lg hover:underline">
                    {a.title}
                  </Link>
                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{a.type}</span>
                  {a.description && <p className="mt-2 text-slate-600 dark:text-slate-400">{a.description}</p>}
                </div>
                <LessonItemActions activityId={a.id} canEdit={isRegional} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
