import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { FriendsPageClient } from "./friends-page-client";

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "tifl") redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const { data: friendRows } = await supabase
    .from("friendships")
    .select("user_id, friend_id")
    .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);
  const friendIds = new Set<string>();
  (friendRows ?? []).forEach((r) => {
    if (r.user_id !== session.user.id) friendIds.add(r.user_id);
    if (r.friend_id !== session.user.id) friendIds.add(r.friend_id);
  });
  const { data: friends } = await supabase
    .from("users")
    .select("id, name")
    .in("id", [...friendIds]);

  const { data: requests } = await supabase
    .from("friend_requests")
    .select("id, from_user_id, to_user_id, status, initial_message, created_at")
    .or(`from_user_id.eq.${session.user.id},to_user_id.eq.${session.user.id}`)
    .order("created_at", { ascending: false });
  const reqUserIds = [...new Set((requests ?? []).flatMap((r) => [r.from_user_id, r.to_user_id]))].filter(
    (id) => id !== session.user.id
  );
  const { data: reqUsers } = await supabase.from("users").select("id, name").in("id", reqUserIds);
  const reqUsersMap = new Map((reqUsers ?? []).map((u) => [u.id, u.name]));

  const incoming = (requests ?? []).filter((r) => r.to_user_id === session.user.id && r.status === "pending");
  const outgoing = (requests ?? []).filter((r) => r.from_user_id === session.user.id && r.status === "pending");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Friends</h1>
      <FriendsPageClient
        friends={friends ?? []}
        incoming={incoming.map((r) => ({
          id: r.id,
          from_user_id: r.from_user_id,
          from_name: reqUsersMap.get(r.from_user_id) ?? "—",
          initial_message: r.initial_message,
          created_at: r.created_at ?? "",
        }))}
        outgoing={outgoing.map((r) => ({
          id: r.id,
          to_user_id: r.to_user_id,
          to_name: reqUsersMap.get(r.to_user_id) ?? "—",
          created_at: r.created_at ?? "",
        }))}
      />
    </div>
  );
}
