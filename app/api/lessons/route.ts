import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lesson_activities")
    .select("id, title, description, link, type, thumbnail_url, section_id, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Only Regional Nazim can create lessons" }, { status: 403 });
  const body = await request.json();
  const { title, description, link, type, thumbnail_url, section_id } = body;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const supabase = createSupabaseServerClient();
  let sectionIdValue: string | null = null;
  if (section_id != null && section_id !== "") {
    const { data: sectionRow } = await supabase
      .from("lesson_sections")
      .select("id")
      .eq("id", String(section_id))
      .single();
    if (!sectionRow) {
      return NextResponse.json({ error: "Invalid section_id" }, { status: 400 });
    }
    sectionIdValue = sectionRow.id;
  }
  const { data, error } = await supabase
    .from("lesson_activities")
    .insert({
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      link: link ? String(link).trim() : null,
      type: type === "article" ? "article" : "video",
      thumbnail_url: thumbnail_url != null && thumbnail_url !== "" ? String(thumbnail_url).trim() : null,
      created_by: session.user.id,
      section_id: sectionIdValue,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
