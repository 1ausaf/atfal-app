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
    .select("id, title, description, link, type, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Only Regional Nazim can create lessons" }, { status: 403 });
  const body = await request.json();
  const { title, description, link, type } = body;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lesson_activities")
    .insert({
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      link: link ? String(link).trim() : null,
      type: type === "article" ? "article" : "video",
      created_by: session.user.id,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
