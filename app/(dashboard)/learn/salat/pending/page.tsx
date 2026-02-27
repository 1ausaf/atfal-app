import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { SalatPendingList } from "./salat-pending-list";

export default async function SalatPendingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim") redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("salat_progress")
    .select("id, user_id, category_id, status, requested_at")
    .eq("status", "ready_for_test")
    .order("requested_at", { ascending: true });
  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-red-600 dark:text-red-400">Failed to load pending tests.</p>
      </div>
    );
  }
  let list = rows ?? [];
  if (session.user.role === "local_nazim" && session.user.majlisId) {
    const { data: usersInMajlis } = await supabase
      .from("users")
      .select("id")
      .eq("majlis_id", session.user.majlisId);
    const ids = new Set((usersInMajlis ?? []).map((u) => u.id));
    list = list.filter((r) => ids.has(r.user_id));
  }
  const userIds = [...new Set(list.map((r) => r.user_id))];
  const categoryIds = [...new Set(list.map((r) => r.category_id))];
  const [userRes, catRes] = await Promise.all([
    userIds.length ? supabase.from("users").select("id, name").in("id", userIds) : { data: [] },
    categoryIds.length ? supabase.from("salat_categories").select("id, title").in("id", categoryIds) : { data: [] },
  ]);
  const usersMap = new Map((userRes.data ?? []).map((u) => [u.id, u]));
  const categoriesMap = new Map((catRes.data ?? []).map((c) => [c.id, c]));

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Salat test requests</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Tifls who requested to be tested. Mark Pass or Fail after testing.
      </p>
      <SalatPendingList
        list={list.map((r) => ({
          id: r.id,
          userName: usersMap.get(r.user_id)?.name ?? "—",
          categoryTitle: categoriesMap.get(r.category_id)?.title ?? "—",
          requestedAt: r.requested_at ?? "",
        }))}
      />
    </div>
  );
}
