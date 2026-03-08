import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getTodayToronto } from "@/lib/datetime";
import { getDailyWordIndex } from "@/lib/wordle";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { data: words, error } = await supabase
    .from("wordle_words")
    .select("id, word")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!words?.length) return NextResponse.json({ error: "No words configured" }, { status: 503 });

  const dateKey = getTodayToronto();
  const index = getDailyWordIndex(dateKey, words.length);
  const row = words[index];
  const wordLength = (row?.word ?? "").length;

  return NextResponse.json({ wordLength });
}
