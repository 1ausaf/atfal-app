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
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  let word = typeof body.word === "string" ? body.word.trim().toUpperCase() : undefined;
  const definitionUsage =
    typeof body.definition_usage === "string" ? body.definition_usage.trim() || null : undefined;

  if (word !== undefined) {
    if (!word) return NextResponse.json({ error: "Word cannot be empty" }, { status: 400 });
    if (word.length !== 5 && word.length !== 6)
      return NextResponse.json({ error: "Word must be 5 or 6 letters" }, { status: 400 });
    if (!/^[A-Z]+$/.test(word))
      return NextResponse.json({ error: "Word must contain only letters" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const updates: { word?: string; definition_usage?: string | null } = {};
  if (word !== undefined) updates.word = word;
  if (definitionUsage !== undefined) updates.definition_usage = definitionUsage;

  if (Object.keys(updates).length === 0) return NextResponse.json({ error: "No updates" }, { status: 400 });

  const { data, error } = await supabase
    .from("wordle_words")
    .update(updates)
    .eq("id", id)
    .select("id, word, definition_usage, created_at")
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
  const { error } = await supabase.from("wordle_words").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
