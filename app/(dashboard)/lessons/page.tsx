import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { LessonItemActions } from "./lesson-item-actions";

export default async function LessonsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const supabase = createSupabaseServerClient();
  const { data: activities } = await supabase
    .from("lesson_activities")
    .select("id, title, description, link, type, thumbnail_url, created_at")
    .order("created_at", { ascending: false });
  const isRegional = session.user.role === "regional_nazim";
  const isTifl = session.user.role === "tifl";

  let incompleteActivities = activities ?? [];
  let pastActivities: typeof activities = [];

  if (isTifl && activities?.length) {
    const { data: submissions } = await supabase
      .from("lesson_submissions")
      .select("activity_id")
      .eq("user_id", session.user.id);
    const submittedIds = new Set((submissions ?? []).map((s) => s.activity_id));
    incompleteActivities = activities.filter((a) => !submittedIds.has(a.id));
    pastActivities = activities.filter((a) => submittedIds.has(a.id));
  }

  function LessonList({ items, showThumb }: { items: typeof activities; showThumb?: boolean }) {
    if (!items?.length) return null;
    return (
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id} className="card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-800 shadow-lg p-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-4 min-w-0 flex-1">
                {showThumb && a.thumbnail_url && (
                  <Link href={`/lessons/${a.id}`} className="shrink-0 block">
                    <Image
                      src={a.thumbnail_url}
                      alt=""
                      width={80}
                      height={60}
                      className="rounded object-cover w-20 h-[60px]"
                    />
                  </Link>
                )}
                <div className="min-w-0">
                  <Link href={`/lessons/${a.id}`} className="font-semibold text-lg hover:underline">
                    {a.title}
                  </Link>
                  <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">{a.type}</span>
                  {a.description && <p className="mt-2 text-slate-600 dark:text-slate-400 line-clamp-2">{a.description}</p>}
                </div>
              </div>
              <LessonItemActions activityId={a.id} canEdit={isRegional} />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lesson activities</h1>
        {isRegional && (
          <>
            <Link href="/lessons/new" className="px-4 py-2 btn-kid-primary rounded-xl inline-block">
              Create lesson
            </Link>
            <Link href="/lessons/submissions" className="px-4 py-2 border-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors inline-block">
              Grade submissions
            </Link>
          </>
        )}
      </div>

      {isTifl ? (
        <>
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">To complete</h2>
            {incompleteActivities.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400">No lesson activities to complete. Great work!</p>
            ) : (
              <LessonList items={incompleteActivities} showThumb />
            )}
          </section>
          {pastActivities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Past lessons</h2>
              <LessonList items={pastActivities} showThumb />
            </section>
          )}
        </>
      ) : (
        <>
          {!activities?.length ? (
            <p className="text-slate-500 dark:text-slate-400">No lesson activities yet.</p>
          ) : (
            <LessonList items={activities} showThumb />
          )}
        </>
      )}
    </div>
  );
}
