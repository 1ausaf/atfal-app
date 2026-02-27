import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl")
    return NextResponse.json({ error: "Only Tifls can search friends" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2)
    return NextResponse.json({ users: [] });

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

  const { data: pendingRows } = await supabase
    .from("friend_requests")
    .select("from_user_id, to_user_id")
    .or(`and(from_user_id.eq.${session.user.id}),and(to_user_id.eq.${session.user.id})`)
    .eq("status", "pending");
  const pendingIds = new Set<string>();
  (pendingRows ?? []).forEach((r) => {
    if (r.from_user_id !== session.user.id) pendingIds.add(r.from_user_id);
    if (r.to_user_id !== session.user.id) pendingIds.add(r.to_user_id);
  });

  let query = supabase
    .from("users")
    .select("id, name")
    .eq("role", "tifl")
    .neq("id", session.user.id)
    .is("deleted_at", null)
    .ilike("name", `%${q}%`)
    .limit(20);

  const { data: users } = await query;
  const filtered = (users ?? []).filter(
    (u) => !friendIds.has(u.id) && !pendingIds.has(u.id)
  );
  return NextResponse.json({ users: filtered });
}
