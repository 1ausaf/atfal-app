import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("schedule_blocks")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.day_of_week !== undefined) updates.day_of_week = body.day_of_week;
  if (body.block_type !== undefined) updates.block_type = body.block_type;
  if (body.label !== undefined) updates.label = body.label;
  if (body.start_time !== undefined) updates.start_time = body.start_time;
  if (body.end_time !== undefined) updates.end_time = body.end_time;

  const { data, error } = await supabase
    .from("schedule_blocks")
    .update(updates)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("schedule_blocks")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
