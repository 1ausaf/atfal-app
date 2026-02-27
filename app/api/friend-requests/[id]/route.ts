import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl")
    return NextResponse.json({ error: "Only Tifls can respond" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const status = body.status;
  if (status !== "accepted" && status !== "rejected")
    return NextResponse.json({ error: "status must be accepted or rejected" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: row, error: fetchErr } = await supabase
    .from("friend_requests")
    .select("id, from_user_id, to_user_id")
    .eq("id", id)
    .single();

  if (fetchErr || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (row.to_user_id !== session.user.id)
    return NextResponse.json({ error: "You can only respond to requests sent to you" }, { status: 403 });
  if (row.from_user_id === session.user.id)
    return NextResponse.json({ error: "Cannot respond to your own request" }, { status: 400 });

  const { error: updateErr } = await supabase
    .from("friend_requests")
    .update({ status, responded_at: new Date().toISOString() })
    .eq("id", id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  if (status === "accepted") {
    const uidA = session.user.id;
    const uidB = row.from_user_id;
    const user_id = uidA < uidB ? uidA : uidB;
    const friend_id = uidA < uidB ? uidB : uidA;
    await supabase.from("friendships").upsert({ user_id, friend_id }, { onConflict: "user_id,friend_id" });
  }

  return NextResponse.json({ ok: true });
}
