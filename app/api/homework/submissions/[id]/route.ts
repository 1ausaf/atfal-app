import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("homework_submissions")
    .select("*, homework:homework_id(*)")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "tifl" && data.user_id !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { status, points_awarded } = body;
  if (!["approved", "rejected"].includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const supabase = createSupabaseServerClient();
  const { data: sub } = await supabase.from("homework_submissions").select("homework_id").eq("id", id).single();
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: hw } = await supabase.from("homework").select("majlis_id").eq("id", sub.homework_id).single();
  if (session.user.role === "local_nazim" && hw?.majlis_id !== session.user.majlisId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const updates: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: session.user.id,
  };
  if (status === "approved") updates.points_awarded = Math.max(0, Number(points_awarded) || 0);
  const { error } = await supabase.from("homework_submissions").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
