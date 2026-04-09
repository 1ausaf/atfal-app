import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getWordleDayToronto } from "@/lib/datetime";
import { resolveDailyCrossword } from "@/lib/crossword-daily";
import { getFullyCorrectClueNumbers, gridsMatchSolution, normalizeUserGrid } from "@/lib/crossword";
import { recordMajlisCompetitionContribution } from "@/lib/majlis-competition";
import {
  getActiveSeasonStartIso,
  incrementUserSeason2Points,
  isTorontoActivityDateInActiveSeason,
} from "@/lib/season-points";

const CROSSWORD_POINTS = 50;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const gridRaw = body.grid;

  const supabase = createSupabaseServerClient();
  const wordleDay = getWordleDayToronto();
  const resolved = await resolveDailyCrossword(supabase, wordleDay);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const { puzzle } = resolved.data;
  const norm = normalizeUserGrid(gridRaw, puzzle.rows, puzzle.cols);
  if (!norm.ok) return NextResponse.json({ error: norm.error }, { status: 400 });

  const correct = gridsMatchSolution(norm.grid, puzzle);
  if (!correct) {
    const wordFeedback = getFullyCorrectClueNumbers(norm.grid, puzzle);
    return NextResponse.json({ correct: false, pointsAwarded: 0, wordFeedback });
  }

  let pointsAwarded = 0;
  if (session.user.role === "tifl") {
    const { data: existing } = await supabase
      .from("activity_log")
      .select("id, points_awarded")
      .eq("user_id", session.user.id)
      .eq("activity_date", wordleDay)
      .eq("activity_type", "crossword")
      .maybeSingle();

    if (!existing || (existing.points_awarded ?? 0) === 0) {
      await supabase.from("activity_log").upsert(
        {
          user_id: session.user.id,
          activity_date: wordleDay,
          activity_type: "crossword",
          points_awarded: CROSSWORD_POINTS,
        },
        { onConflict: "user_id,activity_date,activity_type" }
      );
      pointsAwarded = CROSSWORD_POINTS;
      await recordMajlisCompetitionContribution({
        userId: session.user.id,
        majlisId: session.user.majlisId,
        rawPoints: CROSSWORD_POINTS,
        homeworkPoints: 0,
        eventType: "crossword",
      });
      const activeSeasonStartIso = await getActiveSeasonStartIso(supabase);
      if (isTorontoActivityDateInActiveSeason(wordleDay, activeSeasonStartIso)) {
        await incrementUserSeason2Points(supabase, session.user.id, CROSSWORD_POINTS);
      }
    }
  }

  return NextResponse.json({ correct: true, pointsAwarded });
}
