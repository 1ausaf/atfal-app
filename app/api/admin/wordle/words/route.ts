import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("wordle_words")
    .select("id, word, definition_usage, created_at")
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
  let word = typeof body.word === "string" ? body.word.trim().toUpperCase() : "";
  const definitionUsage = typeof body.definition_usage === "string" ? body.definition_usage.trim() || null : null;

  if (!word) return NextResponse.json({ error: "Word required" }, { status: 400 });
  if (word.length !== 5 && word.length !== 6)
    return NextResponse.json({ error: "Word must be 5 or 6 letters" }, { status: 400 });
  if (!/^[A-Z]+$/.test(word))
    return NextResponse.json({ error: "Word must contain only letters" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("wordle_words")
    .insert({ word, definition_usage: definitionUsage })
    .select("id, word, definition_usage, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
