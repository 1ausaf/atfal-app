import type { CrosswordClueEntry, CrosswordPuzzleJson } from "@/lib/crossword";
import {
  CROSSWORD_MAX_ENTRIES_PER_DIRECTION,
  CROSSWORD_MAX_WORD_LEN,
  CROSSWORD_MIN_ACROSS_CLUES,
  CROSSWORD_MIN_DOWN_CLUES,
  CROSSWORD_MIN_WORD_LEN,
  parseCrosswordPuzzleJson,
  puzzleMeetsDailyMinimums,
} from "@/lib/crossword";

const GRID_SIZE = 22;
const BUILD_ATTEMPTS = 350;
const MAX_BRANCH_CANDS = 40;
const MAX_DFS_NODES = 250_000;

type Dir = "across" | "down";

type WordIn = { word: string; clue: string };

type Placement = { word: string; clue: string; dir: Dir; r: number; c: number };

type Cell = string | null;

function emptyGrid(): Cell[][] {
  return Array.from({ length: GRID_SIZE }, () => Array<Cell>(GRID_SIZE).fill(null));
}

function canPlace(grid: Cell[][], word: string, r: number, c: number, dr: number, dc: number): boolean {
  for (let i = 0; i < word.length; i++) {
    const nr = r + i * dr;
    const nc = c + i * dc;
    if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) return false;
    const g = grid[nr][nc];
    const ch = word[i]!;
    if (g !== null && g !== ch) return false;
  }
  return true;
}

function applyPlace(grid: Cell[][], word: string, r: number, c: number, dr: number, dc: number): void {
  for (let i = 0; i < word.length; i++) {
    const nr = r + i * dr;
    const nc = c + i * dc;
    grid[nr][nc] = word[i]!;
  }
}

/** Apply letters only where cell is empty; returns undo to restore previous cells. */
function applyPlaceWithUndo(grid: Cell[][], word: string, r: number, c: number, dr: number, dc: number): () => void {
  const stack: { r: number; c: number; prev: Cell }[] = [];
  for (let i = 0; i < word.length; i++) {
    const nr = r + i * dr;
    const nc = c + i * dc;
    const prev = grid[nr][nc];
    const ch = word[i]!;
    if (prev === null) {
      grid[nr][nc] = ch;
      stack.push({ r: nr, c: nc, prev });
    } else if (prev !== ch) {
      throw new Error("applyPlaceWithUndo: inconsistent grid");
    }
  }
  return () => {
    for (let j = stack.length - 1; j >= 0; j--) {
      const { r: rr, c: cc, prev: p } = stack[j]!;
      grid[rr]![cc] = p;
    }
  };
}

function intersectionScore(grid: Cell[][], word: string, r: number, c: number, dr: number, dc: number): number {
  let s = 0;
  for (let i = 0; i < word.length; i++) {
    const nr = r + i * dr;
    const nc = c + i * dc;
    const g = grid[nr]![nc]!;
    if (g !== null && g === word[i]!) s++;
  }
  return s;
}

function listCandidates(
  grid: Cell[][],
  word: string,
  dr: number,
  dc: number,
  isFirst: boolean
): [number, number][] {
  if (isFirst) {
    const out: [number, number][] = [];
    if (dr === 1) {
      const c0 = Math.floor(GRID_SIZE / 2);
      for (let r = 1; r <= GRID_SIZE - word.length - 1; r++) {
        out.push([r, c0]);
      }
    } else {
      const r0 = Math.floor(GRID_SIZE / 2);
      for (let c = 1; c <= GRID_SIZE - word.length - 1; c++) {
        out.push([r0, c]);
      }
    }
    return out;
  }

  const out: [number, number][] = [];
  const seen = new Set<string>();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const L = grid[r][c];
      if (L === null) continue;
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== L) continue;
        const sr = r - i * dr;
        const sc = c - i * dc;
        if (sr < 0 || sc < 0) continue;
        if (sr + (word.length - 1) * dr >= GRID_SIZE || sc + (word.length - 1) * dc >= GRID_SIZE) continue;
        if (!canPlace(grid, word, sr, sc, dr, dc)) continue;
        const key = `${sr},${sc}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push([sr, sc]);
      }
    }
  }
  return out;
}

/** DFS with shuffled limited branching — fits typical admin word sets without exploding search space. */
function tryPackDFS(
  grid: Cell[][],
  items: { word: string; clue: string; dir: Dir }[],
  idx: number,
  acc: Placement[],
  counter: { n: number },
  rng: () => number
): Placement[] | null {
  counter.n++;
  if (counter.n > MAX_DFS_NODES) return null;
  if (idx >= items.length) return acc;

  const it = items[idx]!;
  const dr = it.dir === "across" ? 0 : 1;
  const dc = it.dir === "across" ? 1 : 0;
  let cands = listCandidates(grid, it.word, dr, dc, idx === 0);
  if (cands.length === 0) return null;
  shuffleInPlace(cands, rng);
  const scored = cands.map((pos, tieIdx) => ({
    pos,
    tieIdx,
    s: intersectionScore(grid, it.word, pos[0]!, pos[1]!, dr, dc),
  }));
  scored.sort((a, b) => b.s - a.s || a.tieIdx - b.tieIdx);
  cands = scored.slice(0, MAX_BRANCH_CANDS).map((x) => x.pos);

  for (const [r, c] of cands) {
    if (!canPlace(grid, it.word, r, c, dr, dc)) continue;
    const undo = applyPlaceWithUndo(grid, it.word, r, c, dr, dc);
    const nextAcc = [...acc, { word: it.word, clue: it.clue, dir: it.dir, r, c }];
    const res = tryPackDFS(grid, items, idx + 1, nextAcc, counter, rng);
    undo();
    if (res) return res;
  }
  return null;
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
}

/** Longest down first, then interleave remaining down/across by length for more intersections. */
function buildItemOrder(down: WordIn[], across: WordIn[], attempt: number): { word: string; clue: string; dir: Dir }[] {
  const rng = mulberry32(attempt + 901);
  const d = [...down].sort((a, b) => b.word.length - a.word.length);
  const a = [...across].sort((a, b) => b.word.length - a.word.length);
  if (d.length === 0) return [];

  const [firstDown, ...restD] = d;
  const items: { word: string; clue: string; dir: Dir }[] = [{ ...firstDown, dir: "down" }];

  const rd = [...restD];
  const ra = [...a];
  shuffleInPlace(rd, rng);
  shuffleInPlace(ra, rng);

  while (rd.length || ra.length) {
    const nextD = rd[0];
    const nextA = ra[0];
    if (!nextA) {
      items.push({ ...rd.shift()!, dir: "down" });
      continue;
    }
    if (!nextD) {
      items.push({ ...ra.shift()!, dir: "across" });
      continue;
    }
    if (nextD.word.length >= nextA.word.length) items.push({ ...rd.shift()!, dir: "down" });
    else items.push({ ...ra.shift()!, dir: "across" });
  }

  return items;
}

/** Deterministic small PRNG for shuffles */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function placementsToPuzzle(grid: Cell[][], placements: Placement[]): CrosswordPuzzleJson {
  let minR = GRID_SIZE;
  let maxR = -1;
  let minC = GRID_SIZE;
  let maxC = -1;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== null) {
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
        minC = Math.min(minC, c);
        maxC = Math.max(maxC, c);
      }
    }
  }
  if (maxR < 0) throw new Error("empty grid");

  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;
  const solution: (string | null)[][] = [];
  for (let r = minR; r <= maxR; r++) {
    const row: (string | null)[] = [];
    for (let c = minC; c <= maxC; c++) {
      row.push(grid[r][c] ?? null);
    }
    solution.push(row);
  }

  const adjusted = placements.map((p) => ({
    ...p,
    r: p.r - minR,
    c: p.c - minC,
  }));

  type Start = { r: number; c: number; dir: Dir; len: number; clue: string };
  const starts: Start[] = adjusted.map((p) => ({
    r: p.r,
    c: p.c,
    dir: p.dir,
    len: p.word.length,
    clue: p.clue,
  }));

  const byKey = new Map<string, Start[]>();
  for (const s of starts) {
    const k = `${s.r},${s.c}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(s);
  }

  const keys = [...byKey.keys()].sort((ka, kb) => {
    const [ra, ca] = ka.split(",").map(Number);
    const [rb, cb] = kb.split(",").map(Number);
    return ra - rb || ca - cb;
  });

  const numForKey = new Map<string, number>();
  let n = 1;
  for (const k of keys) {
    numForKey.set(k, n++);
  }

  const acrossClues: CrosswordClueEntry[] = [];
  const downClues: CrosswordClueEntry[] = [];
  for (const s of starts) {
    const k = `${s.r},${s.c}`;
    const num = numForKey.get(k)!;
    const entry: CrosswordClueEntry = { n: num, clue: s.clue, row: s.r, col: s.c, len: s.len };
    if (s.dir === "across") acrossClues.push(entry);
    else downClues.push(entry);
  }

  acrossClues.sort((a, b) => a.n - b.n || a.row - b.row || a.col - b.col);
  downClues.sort((a, b) => a.n - b.n || a.row - b.row || a.col - b.col);

  return {
    rows,
    cols,
    solution,
    clues: { across: acrossClues, down: downClues },
  };
}

export function normalizeWordInput(w: string): string {
  return w
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .trim();
}

export function buildPuzzleFromWordLists(
  acrossIn: WordIn[],
  downIn: WordIn[]
): { ok: true; puzzle: CrosswordPuzzleJson } | { ok: false; error: string } {
  if (acrossIn.length < CROSSWORD_MIN_ACROSS_CLUES) {
    return { ok: false, error: `Need at least ${CROSSWORD_MIN_ACROSS_CLUES} across words` };
  }
  if (downIn.length < CROSSWORD_MIN_DOWN_CLUES) {
    return { ok: false, error: `Need at least ${CROSSWORD_MIN_DOWN_CLUES} down words` };
  }
  if (acrossIn.length > CROSSWORD_MAX_ENTRIES_PER_DIRECTION || downIn.length > CROSSWORD_MAX_ENTRIES_PER_DIRECTION) {
    return { ok: false, error: `Too many words in one direction (max ${CROSSWORD_MAX_ENTRIES_PER_DIRECTION})` };
  }

  const across: WordIn[] = [];
  const down: WordIn[] = [];

  for (const x of acrossIn) {
    const word = normalizeWordInput(x.word);
    const clue = typeof x.clue === "string" ? x.clue.trim() : "";
    if (!clue) return { ok: false, error: "Each across word needs a hint" };
    if (word.length < CROSSWORD_MIN_WORD_LEN || word.length > CROSSWORD_MAX_WORD_LEN) {
      return { ok: false, error: `Across word "${x.word}" must be ${CROSSWORD_MIN_WORD_LEN}–${CROSSWORD_MAX_WORD_LEN} letters` };
    }
    across.push({ word, clue });
  }
  for (const x of downIn) {
    const word = normalizeWordInput(x.word);
    const clue = typeof x.clue === "string" ? x.clue.trim() : "";
    if (!clue) return { ok: false, error: "Each down word needs a hint" };
    if (word.length < CROSSWORD_MIN_WORD_LEN || word.length > CROSSWORD_MAX_WORD_LEN) {
      return { ok: false, error: `Down word "${x.word}" must be ${CROSSWORD_MIN_WORD_LEN}–${CROSSWORD_MAX_WORD_LEN} letters` };
    }
    down.push({ word, clue });
  }

  for (let attempt = 0; attempt < BUILD_ATTEMPTS; attempt++) {
    const rng = mulberry32(attempt * 9973 + 17);
    const items = buildItemOrder(down, across, attempt);
    const counter = { n: 0 };
    const placements = tryPackDFS(emptyGrid(), items, 0, [], counter, rng);
    if (!placements) continue;

    const gFilled = emptyGrid();
    for (const p of placements) {
      const dr = p.dir === "across" ? 0 : 1;
      const dc = p.dir === "across" ? 1 : 0;
      applyPlace(gFilled, p.word, p.r, p.c, dr, dc);
    }

    try {
      const puzzle = placementsToPuzzle(gFilled, placements);
      const parsed = parseCrosswordPuzzleJson(puzzle as unknown);
      if (!parsed.ok) continue;
      if (!puzzleMeetsDailyMinimums(parsed.puzzle)) continue;
      return { ok: true, puzzle: parsed.puzzle };
    } catch {
      continue;
    }
  }

  return {
    ok: false,
    error:
      "Could not fit these words into a crossword. Try different words, shorter lengths, or more shared letters between across and down.",
  };
}

/** Reconstruct word+hint lists from stored puzzle (for admin edit). */
export function extractWordListsFromPuzzle(puzzle: CrosswordPuzzleJson): {
  across: WordIn[];
  down: WordIn[];
} {
  const readWord = (cl: CrosswordClueEntry, dir: Dir): string => {
    let s = "";
    for (let k = 0; k < cl.len; k++) {
      const r = cl.row + (dir === "across" ? 0 : k);
      const c = cl.col + (dir === "across" ? k : 0);
      const cell = puzzle.solution[r]?.[c];
      if (cell == null || cell === "#") throw new Error(`Invalid solution at ${r},${c}`);
      s += cell;
    }
    return s;
  };

  const across = puzzle.clues.across.map((cl) => ({
    word: readWord(cl, "across"),
    clue: cl.clue,
  }));
  const down = puzzle.clues.down.map((cl) => ({
    word: readWord(cl, "down"),
    clue: cl.clue,
  }));
  return { across, down };
}
