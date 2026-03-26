import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { PointsBadge } from "@/components/points-badge";

export async function LessonActivitiesWidget({ limit = 5 }: { limit?: number }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") return <p className="text-gray-500">No lessons.</p>;
  const supabase = createSupabaseServerClient();
  const { data: activities } = await supabase
    .from("lesson_activities")
    .select("id, title, type, thumbnail_url, target_age_groups")
    .order("created_at", { ascending: false });
  const { data: profile } = await supabase
    .from("users")
    .select("age_group")
    .eq("id", session.user.id)
    .maybeSingle();
  const tiflAgeGroup = profile?.age_group ?? null;
  const { data: submissions } = await supabase
    .from("lesson_submissions")
    .select("activity_id")
    .eq("user_id", session.user.id);
  const submittedIds = new Set((submissions ?? []).map((s) => s.activity_id));
  const incomplete = (activities ?? []).filter((a) => !submittedIds.has(a.id)).slice(0, limit);
  if (!incomplete.length) return <p className="text-slate-500 dark:text-slate-400">No lesson activities to complete.</p>;

  const incompleteIds = incomplete.map((a) => a.id);
  let pointsAvailableByActivityId: Record<string, number> = {};
  if (incompleteIds.length > 0) {
    const { data: questions } = await supabase
      .from("lesson_questions")
      .select("activity_id, points_value")
      .in("activity_id", incompleteIds);
    const map: Record<string, number> = {};
    for (const q of questions ?? []) {
      const id = q.activity_id;
      const val = typeof (q as { points_value?: number }).points_value === "number" ? (q as { points_value: number }).points_value : 1;
      map[id] = (map[id] ?? 0) + val;
    }
    pointsAvailableByActivityId = map;
  }

  return (
    <ul className="space-y-2">
      {incomplete.map((a) => {
        const pointsAvailable = pointsAvailableByActivityId[a.id] ?? 0;
        const targetAgeGroups = Array.isArray(a.target_age_groups) && a.target_age_groups.length > 0
          ? (a.target_age_groups as string[])
          : ["all"];
        const isAccessible = targetAgeGroups.includes("all") || (tiflAgeGroup != null && targetAgeGroups.includes(tiflAgeGroup));
        const allowedText = targetAgeGroups.includes("all")
          ? "all ages"
          : targetAgeGroups.map((group) => `ages ${group}`).join(", ");
        return (
          <li
            key={a.id}
            className={`flex items-center gap-2 p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/80 dark:border-emerald-800/30 ${
              isAccessible ? "" : "opacity-60"
            }`}
          >
            {a.thumbnail_url && (
              isAccessible ? (
                <Link href={`/lessons/${a.id}`} className="shrink-0">
                  <Image src={a.thumbnail_url} alt="" width={40} height={30} className="rounded-lg object-cover w-10 h-[30px]" />
                </Link>
              ) : (
                <div className="shrink-0 cursor-not-allowed" aria-disabled>
                  <Image src={a.thumbnail_url} alt="" width={40} height={30} className="rounded-lg object-cover w-10 h-[30px] grayscale" />
                </div>
              )
            )}
            <div className="min-w-0 flex-1">
              {isAccessible ? (
                <Link href={`/lessons/${a.id}`} className="link-kid font-medium block truncate">
                  {a.title}
                </Link>
              ) : (
                <span className="font-medium block truncate">{a.title}</span>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400">{a.type}</span>
              {!isAccessible && (
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Content only for {allowedText}.
                </p>
              )}
            </div>
            {pointsAvailable > 0 && (
              <PointsBadge points={pointsAvailable} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
