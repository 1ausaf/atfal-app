import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

async function canAccessConversation(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  conversationId: string,
  userId: string,
  role: string
) {
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", conversationId);
  const userIds = (participants ?? []).map((p) => p.user_id);
  if (userIds.includes(userId)) return true;
  if (role === "regional_nazim") return true;
  return false;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;
  const supabase = createSupabaseServerClient();
  const allowed = await canAccessConversation(supabase, conversationId, session.user.id, session.user.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100);
  const before = searchParams.get("before");

  let query = supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (before) query = query.lt("created_at", before);
  const { data: messages, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const list = (messages ?? []).reverse();
  return NextResponse.json({ messages: list });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;
  const supabase = createSupabaseServerClient();
  const allowed = await canAccessConversation(supabase, conversationId, session.user.id, session.user.role);
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const messageBody = body.body?.trim();
  if (!messageBody) return NextResponse.json({ error: "body required" }, { status: 400 });

  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: session.user.id,
      body: messageBody,
    })
    .select("id, sender_id, body, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(inserted);
}
