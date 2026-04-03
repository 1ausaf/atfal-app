import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { resolveCrosswordPatchBody } from "@/lib/crossword-admin-resolve";

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

  const resolved = resolveCrosswordPatchBody(body);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const updates: { title?: string | null; puzzle_json?: Record<string, unknown> } = {};

  if (title !== undefined) updates.title = title;
  if (resolved.puzzle !== undefined) updates.puzzle_json = resolved.puzzle;

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
