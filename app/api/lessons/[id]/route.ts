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
  const { data, error } = await supabase.from("lesson_activities").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data: questions } = await supabase
    .from("lesson_questions")
    .select("*")
    .eq("activity_id", id)
    .order("order", { ascending: true });
  return NextResponse.json({ ...data, questions: questions ?? [] });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Only Regional Nazim can edit lessons" }, { status: 403 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from("lesson_activities").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { title, description, link, type } = body;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const activityType = type === "article" ? "article" : "video";

  const { error: updateError } = await supabase
    .from("lesson_activities")
    .update({
      title: String(title).trim(),
      description: description != null ? String(description).trim() : null,
      link: link != null ? String(link).trim() : null,
      type: activityType,
    })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Only Regional Nazim can delete lessons" }, { status: 403 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from("lesson_activities").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { error } = await supabase.from("lesson_activities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
