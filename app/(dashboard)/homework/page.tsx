import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { HomeworkList } from "./homework-list";

export const dynamic = "force-dynamic";

export default async function HomeworkPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const supabase = createSupabaseServerClient();
  let tiflAgeGroup: string | null = null;
  if (session.user.role === "tifl") {
    const { data: profile } = await supabase
      .from("users")
      .select("age_group")
      .eq("id", session.user.id)
      .maybeSingle();
    tiflAgeGroup = profile?.age_group ?? null;
    if (!tiflAgeGroup) return <p>Complete your profile to see homework.</p>;
  }
  let query = supabase.from("homework").select("id, majlis_id, title, description, due_by, links, release_at, lesson_activity_id, target_age_groups, created_at").order("due_by", { ascending: true });
  let pastAssignments: Array<{
    id: string;
    title: string;
    due_by: string;
    links: string[];
    submitted_at: string | null;
    points_awarded: number | null;
  }> = [];
  if (session.user.role === "tifl") {
    if (!session.user.majlisId) return <p>Complete your profile to see homework.</p>;
    const nowIso = new Date().toISOString();
    query = query
      .or(`majlis_id.eq.${session.user.majlisId},majlis_id.is.null`)
      .or(`release_at.is.null,release_at.lte.${nowIso}`)
      .or(`target_age_groups.cs.{"all"},target_age_groups.cs.{"${tiflAgeGroup}"}`);
  } else if (session.user.role === "local_nazim") {
    if (!session.user.majlisId) return <p>No Majlis assigned.</p>;
    query = query.eq("majlis_id", session.user.majlisId);
  }

  if (session.user.role === "tifl") {
    // Past-only: show homework where this tifl has an approved submission, including historical items.
    const { data: approvedSubmissions } = await supabase
      .from("homework_submissions")
      .select("homework_id, points_awarded, submitted_at")
      .eq("user_id", session.user.id)
      .eq("status", "approved");

    const approvedHomeworkIds = new Set((approvedSubmissions ?? []).map((s) => s.homework_id));
    if (approvedHomeworkIds.size > 0) {
      const { data: approvedHomework } = await supabase
        .from("homework")
        .select("id, title, due_by, links, created_at, target_age_groups")
        .in("id", [...approvedHomeworkIds]);

      const pointsByHomeworkId = new Map(
        (approvedSubmissions ?? []).map((s) => [s.homework_id, { points_awarded: s.points_awarded as number | null, submitted_at: (s as { submitted_at?: string | null }).submitted_at ?? null }])
      );

      pastAssignments = (approvedHomework ?? [])
        .filter((h) => {
          const groups = Array.isArray((h as { target_age_groups?: unknown }).target_age_groups)
            ? ((h as { target_age_groups?: string[] }).target_age_groups ?? [])
            : ["all"];
          return groups.includes("all") || (tiflAgeGroup != null && groups.includes(tiflAgeGroup));
        })
        .map((h) => ({
        id: h.id,
        title: h.title,
        due_by: h.due_by,
        links: (h.links as string[]) ?? [],
        points_awarded: pointsByHomeworkId.get(h.id)?.points_awarded ?? null,
        submitted_at: pointsByHomeworkId.get(h.id)?.submitted_at ?? null,
        }));
    }
  }

  const { data: homeworkList } = await query;
  // Filter client-safe even if we didn't modify query above (the RPC dummy above is a placeholder guard we avoid).
  const approvedHomeworkIdSet = new Set(pastAssignments.map((p) => p.id));
  const filteredHomeworkList =
    session.user.role === "tifl" ? (homeworkList ?? []).filter((h) => !approvedHomeworkIdSet.has(h.id)) : homeworkList ?? [];

  const { data: majlisList } = await supabase.from("majlis").select("id, name").order("name");
  const { data: lessonList } = await supabase.from("lesson_activities").select("id, title").order("created_at", { ascending: false });
  const canCreate = session.user.role === "local_nazim" || session.user.role === "regional_nazim" || session.user.role === "admin";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Homework</h1>
        {canCreate && (
          <Link href="/homework/new" className="px-4 py-2 btn-kid-primary rounded-xl inline-block">
            Create homework
          </Link>
        )}
      </div>
      <HomeworkList
        initialHomework={filteredHomeworkList}
        role={session.user.role}
        userId={session.user.id}
        userMajlisId={session.user.majlisId ?? null}
        majlisList={majlisList ?? []}
        lessonList={lessonList ?? []}
        pastAssignments={pastAssignments}
      />
    </div>
  );
}
