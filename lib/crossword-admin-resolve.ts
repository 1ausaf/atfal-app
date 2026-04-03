import { buildPuzzleFromWordLists } from "@/lib/crossword-build";
import {
  CROSSWORD_MIN_ACROSS_CLUES,
  CROSSWORD_MIN_DOWN_CLUES,
  parseCrosswordPuzzleJson,
  puzzleMeetsDailyMinimums,
  type CrosswordPuzzleJson,
} from "@/lib/crossword";

function isRecord(x: unknown): x is Record<string, unknown> {
  return x != null && typeof x === "object" && !Array.isArray(x);
}

function mapBuilderEntries(arr: unknown): { word: string; clue: string }[] | null {
  if (!Array.isArray(arr)) return null;
  const out: { word: string; clue: string }[] = [];
  for (const e of arr) {
    if (!isRecord(e)) return null;
    if (typeof e.word !== "string" || typeof e.clue !== "string") return null;
    out.push({ word: e.word, clue: e.clue });
  }
  return out;
}

export function dailyMinimumsErrorMessage(): string {
  return `Puzzle needs at least ${CROSSWORD_MIN_ACROSS_CLUES} across clues and ${CROSSWORD_MIN_DOWN_CLUES} down clues to appear in the daily rotation.`;
}

/**
 * Admin create/update: builder body (`across` / `down` arrays) takes precedence over `puzzle_json`.
 */
export function resolveCrosswordFromAdminBody(body: unknown):
  | { ok: true; puzzle: CrosswordPuzzleJson }
  | { ok: false; error: string } {
  if (!isRecord(body)) return { ok: false, error: "Body must be a JSON object" };

  const across = mapBuilderEntries(body.across);
  const down = mapBuilderEntries(body.down);
  if (across != null && down != null) {
    const built = buildPuzzleFromWordLists(across, down);
    if (!built.ok) return { ok: false, error: built.error };
    if (!puzzleMeetsDailyMinimums(built.puzzle)) return { ok: false, error: dailyMinimumsErrorMessage() };
    return { ok: true, puzzle: built.puzzle };
  }
  if (across != null || down != null) {
    return { ok: false, error: "Builder mode requires both across and down arrays of { word, clue }." };
  }

  if (body.puzzle_json === undefined) {
    return { ok: false, error: "Provide puzzle_json or across and down word lists." };
  }
  const parsed = parseCrosswordPuzzleJson(body.puzzle_json);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  if (!puzzleMeetsDailyMinimums(parsed.puzzle)) return { ok: false, error: dailyMinimumsErrorMessage() };
  return { ok: true, puzzle: parsed.puzzle };
}

/** PATCH: update puzzle only if builder lists or puzzle_json present; otherwise puzzle is omitted. */
export function resolveCrosswordPatchBody(body: unknown):
  | { ok: true; puzzle?: CrosswordPuzzleJson }
  | { ok: false; error: string } {
  if (!isRecord(body)) return { ok: false, error: "Body must be a JSON object" };

  const across = mapBuilderEntries(body.across);
  const down = mapBuilderEntries(body.down);
  const hasBuilder = across != null && down != null;
  const hasPartialBuilder = (across != null) !== (down != null);

  if (hasPartialBuilder) {
    return { ok: false, error: "Builder mode requires both across and down arrays of { word, clue }." };
  }
  if (hasBuilder) {
    const built = buildPuzzleFromWordLists(across, down);
    if (!built.ok) return { ok: false, error: built.error };
    if (!puzzleMeetsDailyMinimums(built.puzzle)) return { ok: false, error: dailyMinimumsErrorMessage() };
    return { ok: true, puzzle: built.puzzle };
  }

  if (body.puzzle_json !== undefined) {
    const parsed = parseCrosswordPuzzleJson(body.puzzle_json);
    if (!parsed.ok) return { ok: false, error: parsed.error };
    if (!puzzleMeetsDailyMinimums(parsed.puzzle)) return { ok: false, error: dailyMinimumsErrorMessage() };
    return { ok: true, puzzle: parsed.puzzle };
  }

  return { ok: true };
}
