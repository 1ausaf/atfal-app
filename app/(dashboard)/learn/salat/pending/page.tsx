import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { SalatPendingList } from "./salat-pending-list";

export default async function SalatPendingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "regional_nazim" && role !== "local_nazim" && role !== "admin") redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const { data: rowsReady, error: errReady } = await supabase
    .from("salat_progress")
    .select("id, user_id, category_id, status, requested_at, passed_arabic, passed_translation")
    .eq("status", "ready_for_test")
    .order("requested_at", { ascending: true });
  const { data: rowsArabicDone, error: errArabic } = await supabase
    .from("salat_progress")
    .select("id, user_id, category_id, status, requested_at, passed_arabic, passed_translation")
    .eq("passed_arabic", true)
    .or("passed_translation.is.null,passed_translation.eq.false");
  if (errReady || errArabic) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-red-600 dark:text-red-400">Failed to load pending tests.</p>
      </div>
    );
  }
  const seen = new Set<string>();
  const list: typeof rowsReady = [];
  (rowsReady ?? []).forEach((r) => {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      list.push(r);
    }
  });
  (rowsArabicDone ?? []).forEach((r) => {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      list.push(r);
    }
  });
  list.sort((a, b) => (a.requested_at || "").localeCompare(b.requested_at || ""));

  const userIds = [...new Set(list.map((r) => r.user_id))];
  const categoryIds = [...new Set(list.map((r) => r.category_id))];
  const [userRes, catRes] = await Promise.all([
    userIds.length ? supabase.from("users").select("id, name, member_code, majlis_id").in("id", userIds) : { data: [] },
    categoryIds.length ? supabase.from("salat_categories").select("id, title").in("id", categoryIds) : { data: [] },
  ]);
  const usersMap = new Map((userRes.data ?? []).map((u) => [u.id, u]));
  const categoriesMap = new Map((catRes.data ?? []).map((c) => [c.id, c]));

  // Local nazim: only show Tifls from their majlis
  const filteredList =
    role === "local_nazim" && session.user.majlisId
      ? list.filter((r) => {
          const u = usersMap.get(r.user_id) as { majlis_id?: string } | undefined;
          return u?.majlis_id === session.user.majlisId;
        })
      : list;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Salat test requests</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Mark each section as Pass or Fail: <strong>Arabic Only</strong> and <strong>Arabic with Translation</strong>.
      </p>
      <SalatPendingList
        list={filteredList.map((r) => {
          const u = usersMap.get(r.user_id);
          return {
            id: r.id,
            userName: u?.name ?? "—",
            userMemberCode: (u as { member_code?: string } | undefined)?.member_code ?? "—",
            categoryTitle: categoriesMap.get(r.category_id)?.title ?? "—",
            requestedAt: r.requested_at ?? "",
            passedArabic: r.passed_arabic === true,
            passedTranslation: r.passed_translation === true,
          };
        })}
      />
    </div>
  );
}
