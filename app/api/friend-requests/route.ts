import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl")
    return NextResponse.json({ error: "Only Tifls" }, { status: 403 });

  const supabase = createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("friend_requests")
    .select("id, from_user_id, to_user_id, status, initial_message, created_at")
    .or(`from_user_id.eq.${session.user.id},to_user_id.eq.${session.user.id}`)
    .order("created_at", { ascending: false });

  const userIds = [...new Set((rows ?? []).flatMap((r) => [r.from_user_id, r.to_user_id]))].filter(
    (id) => id !== session.user.id
  );
  const { data: users } = await supabase.from("users").select("id, name").in("id", userIds);
  const usersMap = new Map((users ?? []).map((u) => [u.id, u]));

  const list = (rows ?? []).map((r) => ({
    id: r.id,
    from_user_id: r.from_user_id,
    to_user_id: r.to_user_id,
    status: r.status,
    initial_message: r.initial_message,
    created_at: r.created_at,
    other_name: usersMap.get(r.from_user_id === session.user.id ? r.to_user_id : r.from_user_id)?.name ?? "—",
    direction: r.from_user_id === session.user.id ? "outgoing" : "incoming",
  }));

  return NextResponse.json({ list });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl")
    return NextResponse.json({ error: "Only Tifls can send friend requests" }, { status: 403 });

  const body = await request.json();
  const to_user_id = body.to_user_id;
  const initial_message = body.initial_message?.trim() || null;
  if (!to_user_id) return NextResponse.json({ error: "to_user_id required" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: toUser } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", to_user_id)
    .single();
  if (!toUser || toUser.role !== "tifl")
    return NextResponse.json({ error: "User not found or not a Tifl" }, { status: 400 });
  if (to_user_id === session.user.id)
    return NextResponse.json({ error: "Cannot request yourself" }, { status: 400 });

  const { data: existingFr } = await supabase
    .from("friend_requests")
    .select("id, status")
    .eq("from_user_id", session.user.id)
    .eq("to_user_id", to_user_id)
    .maybeSingle();
  if (existingFr) {
    if (existingFr.status === "pending")
      return NextResponse.json({ error: "Request already pending" }, { status: 400 });
    return NextResponse.json({ error: "Request already responded" }, { status: 400 });
  }

  const { data: friendRow } = await supabase
    .from("friendships")
    .select("id")
    .or(
      `and(user_id.eq.${session.user.id},friend_id.eq.${to_user_id}),and(user_id.eq.${to_user_id},friend_id.eq.${session.user.id})`
    )
    .maybeSingle();
  if (friendRow) return NextResponse.json({ error: "Already friends" }, { status: 400 });

  const { data: inserted, error } = await supabase
    .from("friend_requests")
    .insert({
      from_user_id: session.user.id,
      to_user_id,
      status: "pending",
      initial_message,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(inserted);
}
