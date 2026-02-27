import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import type { UserRole } from "@/lib/db-types";
import { DashboardNav } from "@/components/dashboard-nav";

async function getNavCounts(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  role: UserRole,
  userId: string,
  majlisId: string | null
) {
  const out = { friends: 0, messages: 0, homework: 0, lessons: 0 };
  if (role !== "tifl") return out;

  const [hwRows, activityRows, submittedHw, submittedLessons] = await Promise.all([
    majlisId ? supabase.from("homework").select("id").eq("majlis_id", majlisId) : Promise.resolve({ data: [] }),
    supabase.from("lesson_activities").select("id"),
    supabase.from("homework_submissions").select("homework_id").eq("user_id", userId),
    supabase.from("lesson_submissions").select("activity_id").eq("user_id", userId),
  ]);
  const hwIds = new Set((hwRows.data ?? []).map((r) => r.id));
  const submittedHwIds = new Set((submittedHw.data ?? []).map((r) => r.homework_id));
  out.homework = [...hwIds].filter((id) => !submittedHwIds.has(id)).length;
  const activityIds = new Set((activityRows.data ?? []).map((r) => r.id));
  const submittedActivityIds = new Set((submittedLessons.data ?? []).map((r) => r.activity_id));
  out.lessons = [...activityIds].filter((id) => !submittedActivityIds.has(id)).length;

  try {
    const { count: friendsCount } = await supabase
      .from("friend_requests")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", userId)
      .eq("status", "pending");
    out.friends = friendsCount ?? 0;
  } catch {
    // friend_requests table may not exist yet
  }
  return out;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const supabase = createSupabaseServerClient();
  if (session.user.role === "tifl") {
    const { data: user } = await supabase
      .from("users")
      .select("profile_completed")
      .eq("id", session.user.id)
      .single();
    if (user && !user.profile_completed) redirect("/profile/complete");
  }
  let majlisName: string | null = null;
  if (session.user.majlisId) {
    const { data } = await supabase.from("majlis").select("name").eq("id", session.user.majlisId).single();
    majlisName = data?.name ?? null;
  }

  const role: UserRole = session.user.role as UserRole;
  const isTifl = role === "tifl";
  const isLocalNazim = role === "local_nazim";
  const isRegionalNazim = role === "regional_nazim";

  const navCounts = await getNavCounts(supabase, role, session.user.id, session.user.majlisId);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-lg text-slate-900 dark:text-white">
            GTA Centre Atfal
          </Link>
          <DashboardNav role={role} navCounts={navCounts} />
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-2">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {isRegionalNazim && "Regional Nazim Atfal"}
            {isLocalNazim && majlisName && `Local Nazim Atfal (${majlisName})`}
            {isTifl && "Tifl"}
          </span>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
