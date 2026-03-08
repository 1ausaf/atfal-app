import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getTodayToronto } from "@/lib/datetime";
import { getDailyWordIndex, getFeedback } from "@/lib/wordle";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const guess = typeof body.guess === "string" ? body.guess.trim().toUpperCase() : "";
  const guessNumber = typeof body.guessNumber === "number" ? body.guessNumber : 1;

  if (!guess) return NextResponse.json({ error: "Guess required" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: words, error } = await supabase
    .from("wordle_words")
    .select("id, word")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!words?.length) return NextResponse.json({ error: "No words configured" }, { status: 503 });

  const dateKey = getTodayToronto();
  const index = getDailyWordIndex(dateKey, words.length);
  const target = words[index]?.word ?? "";

  if (guess.length !== target.length) {
    return NextResponse.json(
      { error: `Guess must be ${target.length} letters` },
      { status: 400 }
    );
  }

  const feedback = getFeedback(guess, target);
  const solved = guess === target;
  const gameOver = solved || guessNumber >= 6;

  const res: { feedback: string[]; solved: boolean; answer?: string } = {
    feedback,
    solved,
  };
  if (gameOver) res.answer = target;

  return NextResponse.json(res);
}
