import type { SupabaseClient } from "@supabase/supabase-js";
import { getDailyWordIndex } from "@/lib/wordle";
import {
  parseCrosswordPuzzleJson,
  puzzleMeetsDailyMinimums,
  puzzleToPlayPayload,
  type CrosswordPuzzleJson,
  type CrosswordPlayPayload,
} from "@/lib/crossword";

export type DailyCrosswordResolved = {
  puzzle: CrosswordPuzzleJson;
  title: string | null;
  play: CrosswordPlayPayload;
  index: number;
  total: number;
};

export async function resolveDailyCrossword(
  supabase: SupabaseClient,
  dateKey: string
): Promise<{ ok: true; data: DailyCrosswordResolved } | { ok: false; error: string; status: number }> {
  const { data: rows, error } = await supabase
    .from("crossword_puzzles")
    .select("id, title, puzzle_json")
    .order("created_at", { ascending: true });

  if (error) return { ok: false, error: error.message, status: 500 };
  const list = rows ?? [];
  if (!list.length) return { ok: false, error: "No crossword puzzles available.", status: 503 };

  type Row = { id: string; title: string | null; puzzle_json: unknown };
  const eligible: { title: string | null; puzzle: CrosswordPuzzleJson }[] = [];
  for (const row of list as Row[]) {
    const parsed = parseCrosswordPuzzleJson(row.puzzle_json);
    if (!parsed.ok) continue;
    if (!puzzleMeetsDailyMinimums(parsed.puzzle)) continue;
    eligible.push({ title: row.title ?? null, puzzle: parsed.puzzle });
  }

  if (eligible.length === 0) {
    return {
      ok: false,
      error:
        "No crossword puzzles meet the daily minimum (at least 4 across and 5 down clues). Add or fix puzzles in Admin.",
      status: 503,
    };
  }

  const index = getDailyWordIndex(dateKey, eligible.length);
  const picked = eligible[index]!;
  const play = puzzleToPlayPayload(picked.title, picked.puzzle);
  return {
    ok: true,
    data: {
      puzzle: picked.puzzle,
      title: picked.title,
      play,
      index,
      total: eligible.length,
    },
  };
}
