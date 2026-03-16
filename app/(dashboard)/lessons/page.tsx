import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { formatDateInToronto } from "@/lib/datetime";
import Link from "next/link";
import Image from "next/image";
import { LessonItemActions } from "./lesson-item-actions";
import { PointsBadge } from "@/components/points-badge";
import { LessonSectionsManager } from "./lesson-sections-manager";

export default async function LessonsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const supabase = createSupabaseServerClient();
  const { data: activities } = await supabase
    .from("lesson_activities")
    .select("id, title, description, link, type, thumbnail_url, section_id, created_at")
    .order("created_at", { ascending: false });
  const { data: sections } = await supabase
    .from("lesson_sections")
    .select("id, title, description, thumbnail_url, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const isRegional = session.user.role === "regional_nazim" || session.user.role === "admin";
  const isTifl = session.user.role === "tifl";

  let incompleteActivities = activities ?? [];
  let pastActivities: typeof activities = [];

  let submissionByActivityId: Record<string, { points_awarded: number; created_at: string }> = {};
  if (isTifl && activities?.length) {
    const { data: submissions } = await supabase
      .from("lesson_submissions")
      .select("activity_id, points_awarded, created_at")
      .eq("user_id", session.user.id);
    const submittedIds = new Set((submissions ?? []).map((s) => s.activity_id));
    incompleteActivities = activities.filter((a) => !submittedIds.has(a.id));
    pastActivities = activities.filter((a) => submittedIds.has(a.id));
    for (const s of submissions ?? []) {
      submissionByActivityId[s.activity_id] = {
        points_awarded: s.points_awarded ?? 0,
        created_at: s.created_at ?? "",
      };
    }
  }

  const activityIds = (activities ?? []).map((a) => a.id);
  let pointsAvailableByActivityId: Record<string, number> = {};
  if (activityIds.length > 0) {
    const { data: questions } = await supabase
      .from("lesson_questions")
      .select("activity_id, points_value")
      .in("activity_id", activityIds);
    const map: Record<string, number> = {};
    for (const q of questions ?? []) {
      const id = q.activity_id;
      const val = typeof (q as { points_value?: number }).points_value === "number" ? (q as { points_value: number }).points_value : 1;
      map[id] = (map[id] ?? 0) + val;
    }
    pointsAvailableByActivityId = map;
  }

  function LessonList({
    items,
    showThumb,
    submissionByActivityId: subMap,
    pointsAvailableByActivityId: pointsMap,
  }: {
    items: typeof activities;
    showThumb?: boolean;
    submissionByActivityId?: Record<string, { points_awarded: number; created_at: string }>;
    pointsAvailableByActivityId?: Record<string, number>;
  }) {
    if (!items?.length) return null;
    return (
      <ul className="flex flex-col gap-3">
        {items.map((a) => {
          const sub = subMap?.[a.id];
          const pointsAvailable = pointsMap?.[a.id] ?? 0;
          return (
            <li key={a.id} className="content-module-item">
              <div className="flex justify-between items-start gap-4">
                <div className="flex gap-4 min-w-0 flex-1">
                  {showThumb && a.thumbnail_url && (
                    <Link href={`/lessons/${a.id}`} className="shrink-0 block">
                      <div className="relative w-20 h-[60px]">
                        <Image
                          src={a.thumbnail_url}
                          alt=""
                          width={80}
                          height={60}
                          className="rounded-lg object-cover w-20 h-[60px]"
                        />
                        {sub && (
                          <>
                            <div className="absolute inset-0 bg-black/50 rounded-lg" />
                            <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                              ✓
                            </div>
                          </>
                        )}
                      </div>
                    </Link>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/lessons/${a.id}`} className="font-semibold text-lg text-gta-text hover:underline">
                        {a.title}
                      </Link>
                      {pointsAvailable > 0 && !sub && <PointsBadge points={pointsAvailable} />}
                      {sub && pointsAvailable > 0 && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          ✓ {sub.points_awarded} / {pointsAvailable} pts
                        </span>
                      )}
                      <span className="text-sm text-gta-textSecondary">{a.type}</span>
                    </div>
                    {a.description && <p className="mt-2 text-gta-textSecondary line-clamp-2">{a.description}</p>}
                    {sub && (
                      <p className="mt-1 text-sm text-gta-textSecondary">
                        Submitted {formatDateInToronto(sub.created_at)} · <span className="font-semibold text-gta-primary">{sub.points_awarded} pts</span>
                      </p>
                    )}
                  </div>
                </div>
                <LessonItemActions activityId={a.id} canEdit={isRegional} />
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  // Build per-section stats for tifls
  const sectionsList = sections ?? [];
  const sectionStats =
    isTifl && activities
      ? sectionsList.map((s) => {
          const lessonsInSection = activities.filter((a) => a.section_id === s.id);
          const incompleteInSection = lessonsInSection.filter((a) =>
            incompleteActivities.some((ia) => ia.id === a.id)
          ).length;
          return {
            section: s,
            total: lessonsInSection.length,
            incomplete: incompleteInSection,
          };
        })
      : [];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gta-text">Lesson activities</h1>
        <div className="flex items-center gap-3">
          {isRegional && (
            <>
              <Link href="/lessons/new" className="px-4 py-2 btn-kid-primary rounded-gta inline-block">
                Create lesson
              </Link>
              <Link
                href="/lessons/submissions"
                className="px-4 py-2 border-2 border-gta-primary text-gta-primary rounded-gta hover:bg-gta-surfaceSecondary transition-colors inline-block font-semibold"
              >
                Grade submissions
              </Link>
            </>
          )}
        </div>
      </div>

      {isRegional && <LessonSectionsManager />}

      {isTifl ? (
        <>
          {sectionStats.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gta-text mb-3">Sections</h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {sectionStats.map(({ section, total, incomplete }) => (
                  <div
                    key={section.id}
                    className="relative min-w-[160px] rounded-xl border border-gta-border bg-gta-surface dark:bg-slate-800 p-3 flex flex-col gap-2"
                  >
                    {section.thumbnail_url ? (
                      <div className="relative w-full h-24 mb-1 overflow-hidden rounded-lg">
                        <Image
                          src={section.thumbnail_url}
                          alt={section.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-gta-text dark:text-slate-100 line-clamp-2">
                        {section.title}
                      </p>
                      {incomplete > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center min-w-[1.5rem] h-6 rounded-full bg-red-500 text-white text-xs font-bold px-1">
                          {incomplete}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gta-textSecondary dark:text-slate-400">
                      {total} lesson{total === 1 ? "" : "s"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="mb-8">
            <h2 className="text-lg font-bold text-gta-text mb-3">To complete</h2>
            {incompleteActivities.length === 0 ? (
              <p className="text-gta-textSecondary">No lesson activities to complete. Great work!</p>
            ) : (
              <LessonList items={incompleteActivities} showThumb pointsAvailableByActivityId={pointsAvailableByActivityId} />
            )}
          </section>
          {pastActivities.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gta-text mb-3">Past lessons</h2>
              <LessonList items={pastActivities} showThumb submissionByActivityId={submissionByActivityId} pointsAvailableByActivityId={pointsAvailableByActivityId} />
            </section>
          )}
        </>
      ) : (
        <>
          {!activities?.length ? (
            <p className="text-gta-textSecondary">No lesson activities yet.</p>
          ) : (
            <LessonList items={activities} showThumb pointsAvailableByActivityId={pointsAvailableByActivityId} />
          )}
        </>
      )}
    </div>
  );
}
