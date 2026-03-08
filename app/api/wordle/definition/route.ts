import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word")?.trim().toUpperCase();
  if (!word) return NextResponse.json({ error: "Word required" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: row, error } = await supabase
    .from("wordle_words")
    .select("definition_usage")
    .eq("word", word)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (row?.definition_usage) {
    return NextResponse.json({ definitionUsage: row.definition_usage });
  }

  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`
    );
    if (!res.ok) {
      return NextResponse.json({
        definitionUsage: `"${word}" — No definition found. You can add one in Admin > Wordle.`,
      });
    }
    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (!first?.meanings?.length) {
      return NextResponse.json({
        definitionUsage: `"${word}" — No definition found. You can add one in Admin > Wordle.`,
      });
    }
    const parts: string[] = [];
    for (const m of first.meanings.slice(0, 2)) {
      const def = m.definitions?.[0]?.definition;
      const example = m.definitions?.[0]?.example;
      if (def) parts.push(def);
      if (example) parts.push(`Example: ${example}`);
    }
    const definitionUsage = parts.length ? parts.join("\n\n") : `"${word}" — No definition found.`;
    return NextResponse.json({ definitionUsage });
  } catch {
    return NextResponse.json({
      definitionUsage: `"${word}" — Could not load definition. You can add one in Admin > Wordle.`,
    });
  }
}
