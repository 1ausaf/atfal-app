import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getWordleDayToronto } from "@/lib/datetime";
import { resolveDailyCrossword } from "@/lib/crossword-daily";

const CROSSWORD_POINTS = 50;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const wordleDay = getWordleDayToronto();
  const resolved = await resolveDailyCrossword(supabase, wordleDay);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const { play, index, total } = resolved.data;
  let alreadyCompleted = false;
  let pointsEarnedToday: number | null = null;

  if (session.user.role === "tifl") {
    const { data: existing } = await supabase
      .from("activity_log")
      .select("points_awarded")
      .eq("user_id", session.user.id)
      .eq("activity_date", wordleDay)
      .eq("activity_type", "crossword")
      .maybeSingle();
    const pts = existing?.points_awarded ?? 0;
    alreadyCompleted = pts > 0;
    pointsEarnedToday = pts;
  }

  return NextResponse.json({
    wordleDay,
    puzzleIndex: index,
    puzzleCount: total,
    title: play.title,
    rows: play.rows,
    cols: play.cols,
    blocked: play.blocked,
    clueStarts: play.clueStarts,
    clues: play.clues,
    alreadyCompleted,
    pointsPerCompletion: session.user.role === "tifl" ? CROSSWORD_POINTS : 0,
    pointsEarnedToday: session.user.role === "tifl" ? pointsEarnedToday : null,
  });
}
