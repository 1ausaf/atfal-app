import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const isRegionalOrAdmin = session.user.role === "regional_nazim" || session.user.role === "admin";

  let convIds: string[];
  if (isRegionalOrAdmin) {
    const { data: convs } = await supabase
      .from("conversations")
      .select("id, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    convIds = (convs ?? []).map((c) => c.id);
  } else {
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", session.user.id);
    convIds = [...new Set((participants ?? []).map((p) => p.conversation_id))];
  }
  if (!convIds.length) return NextResponse.json({ conversations: [] });

  const { data: convs } = await supabase
    .from("conversations")
    .select("id, created_at")
    .in("id", convIds);

  const { data: allParts } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", convIds);
  const userIds = [...new Set((allParts ?? []).map((p) => p.user_id))];
  const { data: users } = await supabase.from("users").select("id, name, role").in("id", userIds);
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  const partsByConv = new Map<string, { name: string; role: string }[]>();
  (allParts ?? []).forEach((p) => {
    const u = userMap.get(p.user_id);
    if (!partsByConv.has(p.conversation_id)) partsByConv.set(p.conversation_id, []);
    partsByConv.get(p.conversation_id)!.push({ name: u?.name ?? "—", role: u?.role ?? "—" });
  });
  const otherUserIdByConv = new Map<string, string>();
  (allParts ?? []).forEach((p) => {
    if (p.user_id !== session.user.id) otherUserIdByConv.set(p.conversation_id, p.user_id);
  });

  const { data: lastMessages } = await supabase
    .from("messages")
    .select("conversation_id, body, created_at")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });
  const lastByConv = new Map<string, { body: string; created_at: string }>();
  (lastMessages ?? []).forEach((m) => {
    if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, { body: m.body, created_at: m.created_at });
  });

  const conversations = (convs ?? []).map((c) => {
    const last = lastByConv.get(c.id);
    const participantsList = partsByConv.get(c.id) ?? [];
    const other_name = isRegionalOrAdmin
      ? participantsList.map((p) => `${p.name} (${p.role})`).join(" — ") || "—"
      : (userMap.get(otherUserIdByConv.get(c.id) ?? "")?.name ?? "—");
    const otherId = otherUserIdByConv.get(c.id) ?? null;
    return {
      id: c.id,
      other_user_id: otherId,
      other_name,
      last_message: last?.body ?? null,
      last_at: last?.created_at ?? c.created_at,
    };
  });
  conversations.sort((a, b) => (b.last_at > a.last_at ? 1 : -1));
  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const other_user_id = body.other_user_id;
  if (!other_user_id) return NextResponse.json({ error: "other_user_id required" }, { status: 400 });
  if (other_user_id === session.user.id)
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: otherUser } = await supabase
    .from("users")
    .select("id, role, majlis_id")
    .eq("id", other_user_id)
    .single();
  if (!otherUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const myRole = session.user.role;
  const otherRole = otherUser.role;

  if (myRole === "tifl" && otherRole === "tifl") {
    const uidA = session.user.id;
    const uidB = other_user_id;
    const user_id = uidA < uidB ? uidA : uidB;
    const friend_id = uidA < uidB ? uidB : uidA;
    const { data: friendship } = await supabase
      .from("friendships")
      .select("id")
      .eq("user_id", user_id)
      .eq("friend_id", friend_id)
      .maybeSingle();
    if (!friendship) return NextResponse.json({ error: "You must be friends to message" }, { status: 403 });
  } else if (myRole === "tifl" && otherRole === "local_nazim") {
    if (session.user.majlisId !== otherUser.majlis_id)
      return NextResponse.json({ error: "You can only message your Local Nazim" }, { status: 403 });
  } else if (myRole === "local_nazim" && otherRole === "tifl") {
    if (session.user.majlisId !== otherUser.majlis_id)
      return NextResponse.json({ error: "You can only message Tifls in your Majlis" }, { status: 403 });
  }
  // Tifl–Regional, Regional–Tifl, Regional–any: allowed

  const participantIds = [session.user.id, other_user_id].sort();
  const { data: existingParts } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("user_id", participantIds);
  const convIdsByUser = new Map<string, Set<string>>();
  (existingParts ?? []).forEach((p) => {
    if (!convIdsByUser.has(p.user_id)) convIdsByUser.set(p.user_id, new Set());
    convIdsByUser.get(p.user_id)!.add(p.conversation_id);
  });
  const myConvIds = convIdsByUser.get(session.user.id) ?? new Set();
  const otherConvIds = convIdsByUser.get(other_user_id) ?? new Set();
  let existingConvId: string | null = null;
  myConvIds.forEach((cid) => {
    if (otherConvIds.has(cid)) existingConvId = cid;
  });

  if (existingConvId) return NextResponse.json({ id: existingConvId });

  const { data: newConv, error: convErr } = await supabase
    .from("conversations")
    .insert({})
    .select("id")
    .single();
  if (convErr || !newConv) return NextResponse.json({ error: convErr?.message ?? "Failed to create conversation" }, { status: 500 });

  const { error: partErr } = await supabase.from("conversation_participants").insert([
    { conversation_id: newConv.id, user_id: session.user.id },
    { conversation_id: newConv.id, user_id: other_user_id },
  ]);
  if (partErr) return NextResponse.json({ error: partErr.message }, { status: 500 });
  return NextResponse.json({ id: newConv.id });
}
