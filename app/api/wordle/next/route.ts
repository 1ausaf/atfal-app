import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getWordIndexFromSeed } from "@/lib/wordle";
import { WORDLE_FALLBACK_WORDS } from "@/lib/wordle-fallback-words";

async function getCombinedWords(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<string[]> {
  const { data: rows, error } = await supabase
    .from("wordle_words")
    .select("word")
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (rows?.length) return rows.map((r) => (r.word ?? "").toUpperCase()).filter(Boolean);
  return WORDLE_FALLBACK_WORDS;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const seed = searchParams.get("seed")?.trim();
  if (!seed) return NextResponse.json({ error: "Seed required" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  let combined: string[];
  try {
    combined = await getCombinedWords(supabase);
  } catch (e) {
    return NextResponse.json({ error: "Failed to load words" }, { status: 500 });
  }

  if (!combined.length) return NextResponse.json({ error: "No words available" }, { status: 503 });

  const index = getWordIndexFromSeed(seed, combined.length);
  const word = combined[index] ?? combined[0];
  return NextResponse.json({ wordLength: word.length });
}
