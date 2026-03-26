import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { LessonContent } from "./lesson-content";
import { PointsBadge } from "@/components/points-badge";

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: activity } = await supabase.from("lesson_activities").select("*").eq("id", id).single();
  if (!activity) notFound();
  if (session.user.role === "tifl") {
    const { data: profile } = await supabase
      .from("users")
      .select("age_group")
      .eq("id", session.user.id)
      .maybeSingle();
    const tiflAgeGroup = profile?.age_group;
    const targetAgeGroups = Array.isArray(activity.target_age_groups) ? (activity.target_age_groups as string[]) : ["all"];
    if (!(targetAgeGroups.includes("all") || (tiflAgeGroup != null && targetAgeGroups.includes(tiflAgeGroup)))) {
      notFound();
    }
  }
  const { data: questions } = await supabase
    .from("lesson_questions")
    .select("*")
    .eq("activity_id", id)
    .order("order", { ascending: true });
  let existingSubmission: { status: string; points_awarded: number; answers: Record<string, string>; auto_points: number } | null = null;
  if (session.user.role === "tifl") {
    const { data: sub } = await supabase
      .from("lesson_submissions")
      .select("status, points_awarded, answers, auto_points")
      .eq("activity_id", id)
      .eq("user_id", session.user.id)
      .single();
    if (sub) {
      existingSubmission = {
        status: sub.status,
        points_awarded: sub.points_awarded ?? 0,
        answers: (sub.answers as Record<string, string>) ?? {},
        auto_points: typeof (sub as { auto_points?: number }).auto_points === "number" ? (sub as { auto_points: number }).auto_points : 0,
      };
    }
  }

  const totalPointsAvailable = (questions ?? []).reduce(
    (sum, q) => sum + (typeof (q as { points_value?: number }).points_value === "number" ? (q as { points_value: number }).points_value : 1),
    0
  );
  const isTifl = session.user.role === "tifl";
  const showPointsAvailableBadge = isTifl && !existingSubmission && totalPointsAvailable > 0;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/lessons" className="text-green-600 hover:underline dark:text-emerald-400 mb-4 inline-block">Back to lessons</Link>
      {activity.thumbnail_url && (
        <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <Image
            src={activity.thumbnail_url}
            alt=""
            width={640}
            height={360}
            className="w-full h-auto object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">{activity.title}</h1>
        {showPointsAvailableBadge && <PointsBadge points={totalPointsAvailable} variant="upTo" />}
      </div>
      {activity.description && <p className="mt-2 text-slate-600 dark:text-slate-400">{activity.description}</p>}
      {(session.user.role === "regional_nazim" || session.user.role === "admin") && (
        <p className="mt-3">
          <Link href={`/lessons/${id}/questions`} className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
            Manage questions
          </Link>
        </p>
      )}
      <LessonContent
        activity={activity}
        questions={questions ?? []}
        existingSubmission={existingSubmission}
        isTifl={session.user.role === "tifl"}
      />
    </div>
  );
}
