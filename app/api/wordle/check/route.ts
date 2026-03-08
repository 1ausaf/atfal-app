import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getWordleDayToronto } from "@/lib/datetime";
import { getWordIndexFromSeed, getFeedback } from "@/lib/wordle";
import { WORDLE_FALLBACK_WORDS } from "@/lib/wordle-fallback-words";

const WORDLE_POINTS = 50;

async function getCombinedWords(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<string[]> {
  const { data: rows, error } = await supabase
    .from("wordle_words")
    .select("word")
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (rows?.length) return rows.map((r) => (r.word ?? "").toUpperCase()).filter(Boolean);
  return WORDLE_FALLBACK_WORDS;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const guess = typeof body.guess === "string" ? body.guess.trim().toUpperCase() : "";
  const seed = typeof body.seed === "string" ? body.seed.trim() : "";
  const guessNumber = typeof body.guessNumber === "number" ? body.guessNumber : 1;

  if (!guess) return NextResponse.json({ error: "Guess required" }, { status: 400 });
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
  const target = combined[index] ?? combined[0];

  if (guess.length !== target.length) {
    return NextResponse.json(
      { error: `Guess must be ${target.length} letters` },
      { status: 400 }
    );
  }

  const feedback = getFeedback(guess, target);
  const solved = guess === target;
  const gameOver = solved || guessNumber >= 6;

  let pointsAwarded = 0;
  if (gameOver && solved && session.user.role === "tifl") {
    const wordleDay = getWordleDayToronto();
    const { data: existing } = await supabase
      .from("activity_log")
      .select("id, points_awarded")
      .eq("user_id", session.user.id)
      .eq("activity_date", wordleDay)
      .eq("activity_type", "wordle")
      .maybeSingle();

    if (!existing || (existing.points_awarded ?? 0) === 0) {
      await supabase.from("activity_log").upsert(
        {
          user_id: session.user.id,
          activity_date: wordleDay,
          activity_type: "wordle",
          points_awarded: WORDLE_POINTS,
        },
        { onConflict: "user_id,activity_date,activity_type" }
      );
      pointsAwarded = WORDLE_POINTS;
    }
  }

  const res: { feedback: string[]; solved: boolean; answer?: string; pointsAwarded?: number } = {
    feedback,
    solved,
  };
  if (gameOver) res.answer = target;
  if (gameOver && solved) res.pointsAwarded = pointsAwarded;

  return NextResponse.json(res);
}
