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
  const { data, error } = await supabase.from("homework").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "tifl") {
    if (data.majlis_id != null && data.majlis_id !== session.user.majlisId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (data.release_at != null && new Date(data.release_at) > new Date())
      return NextResponse.json({ error: "Homework is not yet released" }, { status: 403 });
  }
  if (session.user.role === "local_nazim" && data.majlis_id !== session.user.majlisId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(data);
}

function canEditHomework(role: string, userMajlisId: string | null, homeworkMajlisId: string | null): boolean {
  if (role !== "local_nazim" && role !== "regional_nazim" && role !== "admin") return false;
  if (role === "regional_nazim" || role === "admin") return true;
  return userMajlisId != null && homeworkMajlisId === userMajlisId;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from("homework").select("id, majlis_id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditHomework(session.user.role, session.user.majlisId ?? null, existing.majlis_id))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { title, description, due_by, links, majlis_id, release_at, lesson_activity_id } = body;
  if (!title || !due_by) return NextResponse.json({ error: "Title and due_by required" }, { status: 400 });
  const majlisId = session.user.role === "regional_nazim" || session.user.role === "admin"
    ? (majlis_id !== undefined ? majlis_id : existing.majlis_id)
    : existing.majlis_id;
  if (session.user.role === "local_nazim" && majlisId !== session.user.majlisId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (lesson_activity_id !== undefined && lesson_activity_id != null && lesson_activity_id !== "") {
    const { data: lesson } = await supabase.from("lesson_activities").select("id").eq("id", lesson_activity_id).single();
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 400 });
  }
  const releaseAt = release_at !== undefined
    ? (release_at != null && release_at !== "" ? new Date(release_at).toISOString() : null)
    : undefined;

  const updatePayload: {
    title: string;
    description: string | null;
    due_by: string;
    links: string[];
    majlis_id: string | null;
    release_at?: string | null;
    lesson_activity_id?: string | null;
  } = {
    title: String(title).trim(),
    description: description != null ? String(description).trim() : null,
    due_by: new Date(due_by).toISOString(),
    links: Array.isArray(links) ? links : [],
    majlis_id: majlisId ?? null,
  };
  if (releaseAt !== undefined) updatePayload.release_at = releaseAt;
  if (lesson_activity_id !== undefined) updatePayload.lesson_activity_id = lesson_activity_id || null;
  const { error: updateError } = await supabase
    .from("homework")
    .update(updatePayload)
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
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from("homework").select("id, majlis_id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditHomework(session.user.role, session.user.majlisId ?? null, existing.majlis_id))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { error } = await supabase.from("homework").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
