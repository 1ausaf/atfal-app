import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { parseCrosswordPuzzleJson } from "@/lib/crossword";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() || null : undefined;
  const puzzleJson = body.puzzle_json;

  const supabase = createSupabaseServerClient();
  const updates: { title?: string | null; puzzle_json?: Record<string, unknown> } = {};

  if (title !== undefined) updates.title = title;
  if (puzzleJson !== undefined) {
    const parsed = parseCrosswordPuzzleJson(puzzleJson);
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    updates.puzzle_json = parsed.puzzle;
  }

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No updates" }, { status: 400 });

  const { data, error } = await supabase
    .from("crossword_puzzles")
    .update(updates)
    .eq("id", id)
    .select("id, title, puzzle_json, created_at")
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
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("crossword_puzzles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
