import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lesson_sections")
    .select("id, title, description, thumbnail_url, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Only Regional Nazim can create sections" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const { title, description, thumbnail_url, sort_order } = body as {
    title?: string;
    description?: string | null;
    thumbnail_url?: string | null;
    sort_order?: number;
  };
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("lesson_sections")
    .insert({
      title: title.trim(),
      description: description != null ? String(description).trim() : null,
      thumbnail_url: thumbnail_url != null && thumbnail_url !== "" ? String(thumbnail_url).trim() : null,
      sort_order: typeof sort_order === "number" ? sort_order : 0,
      created_by: session.user.id,
    })
    .select("id, title, description, thumbnail_url, sort_order, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

