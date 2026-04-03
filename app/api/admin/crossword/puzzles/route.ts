import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { resolveCrosswordFromAdminBody } from "@/lib/crossword-admin-resolve";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("crossword_puzzles")
    .select("id, title, puzzle_json, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() || null : null;

  const resolved = resolveCrosswordFromAdminBody(body);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("crossword_puzzles")
    .insert({
      title,
      puzzle_json: resolved.puzzle,
    })
    .select("id, title, puzzle_json, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
