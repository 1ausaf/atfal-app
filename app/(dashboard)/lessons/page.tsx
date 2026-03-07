import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { formatDateInToronto } from "@/lib/datetime";
import Link from "next/link";
import Image from "next/image";
import { LessonItemActions } from "./lesson-item-actions";
import { PointsBadge } from "@/components/points-badge";

export default async function LessonsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const supabase = createSupabaseServerClient();
  const { data: activities } = await supabase
    .from("lesson_activities")
    .select("id, title, description, link, type, thumbnail_url, created_at")
    .order("created_at", { ascending: false });
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
                      <Image
                        src={a.thumbnail_url}
                        alt=""
                        width={80}
                        height={60}
                        className="rounded-lg object-cover w-20 h-[60px]"
                      />
                    </Link>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/lessons/${a.id}`} className="font-semibold text-lg text-gta-text hover:underline">
                        {a.title}
                      </Link>
                      {pointsAvailable > 0 && <PointsBadge points={pointsAvailable} />}
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gta-text">Lesson activities</h1>
        {isRegional && (
          <>
            <Link href="/lessons/new" className="px-4 py-2 btn-kid-primary rounded-gta inline-block">
              Create lesson
            </Link>
            <Link href="/lessons/submissions" className="px-4 py-2 border-2 border-gta-primary text-gta-primary rounded-gta hover:bg-gta-surfaceSecondary transition-colors inline-block font-semibold">
              Grade submissions
            </Link>
          </>
        )}
      </div>

      {isTifl ? (
        <>
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
