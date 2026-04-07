import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { data: friendRows } = await supabase
    .from("friendships")
    .select("user_id, friend_id")
    .or(`user_id.eq.${session.user.id},friend_id.eq.${session.user.id}`);

  const friendIds = new Set<string>();
  (friendRows ?? []).forEach((row) => {
    if (row.user_id !== session.user.id) friendIds.add(row.user_id);
    if (row.friend_id !== session.user.id) friendIds.add(row.friend_id);
  });

  if (!friendIds.size) return NextResponse.json({ friends: [] });

  const { data: friends } = await supabase
    .from("users")
    .select("id, name, member_code")
    .in("id", [...friendIds])
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return NextResponse.json({ friends: friends ?? [] });
}
