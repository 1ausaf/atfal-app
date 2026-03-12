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
    .from("goals")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.target_value !== undefined) updates.target_value = body.target_value;
  if (body.current_value !== undefined) updates.current_value = body.current_value;
  if (body.status !== undefined && (body.status === "active" || body.status === "completed")) {
    updates.status = body.status;
  }
  if (body.due_date !== undefined) {
    if (body.due_date === null || body.due_date === "") {
      updates.due_date = null;
    } else if (typeof body.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.due_date)) {
      updates.due_date = body.due_date;
    }
  }
  if (body.description !== undefined) {
    updates.description =
      body.description === null || body.description === "" ? null : String(body.description).trim();
  }

  const { data, error } = await supabase
    .from("goals")
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
    .from("goals")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
