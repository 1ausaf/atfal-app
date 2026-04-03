import type { SupabaseClient } from "@supabase/supabase-js";
import { getDailyWordIndex } from "@/lib/wordle";
import {
  parseCrosswordPuzzleJson,
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

  const index = getDailyWordIndex(dateKey, list.length);
  const row = list[index];
  const parsed = parseCrosswordPuzzleJson(row.puzzle_json);
  if (!parsed.ok) return { ok: false, error: `Invalid puzzle in database: ${parsed.error}`, status: 500 };

  const play = puzzleToPlayPayload(row.title ?? null, parsed.puzzle);
  return {
    ok: true,
    data: {
      puzzle: parsed.puzzle,
      title: row.title ?? null,
      play,
      index,
      total: list.length,
    },
  };
}
