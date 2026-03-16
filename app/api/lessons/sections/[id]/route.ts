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
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Only Regional Nazim can edit sections" }, { status: 403 });
  }
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from("lesson_sections").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { title, description, thumbnail_url, sort_order } = body as {
    title?: string;
    description?: string | null;
    thumbnail_url?: string | null;
    sort_order?: number;
  };

  const updates: Record<string, unknown> = {};
  if (title !== undefined) {
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title required" }, { status: 400 });
    }
    updates.title = title.trim();
  }
  if (description !== undefined) {
    updates.description = description != null ? String(description).trim() : null;
  }
  if (thumbnail_url !== undefined) {
    updates.thumbnail_url =
      thumbnail_url != null && thumbnail_url !== "" ? String(thumbnail_url).trim() : null;
  }
  if (sort_order !== undefined) {
    updates.sort_order = typeof sort_order === "number" ? sort_order : 0;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lesson_sections")
    .update(updates)
    .eq("id", id)
    .select("id, title, description, thumbnail_url, sort_order, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Only Regional Nazim can delete sections" }, { status: 403 });
  }
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from("lesson_sections").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { error } = await supabase.from("lesson_sections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

