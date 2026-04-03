/**
 * Crossword puzzle JSON (stored in crossword_puzzles.puzzle_json).
 * - solution[r][c]: "#" | null = black square; A–Z single letter otherwise.
 * - clues: numbered entries with start cell and length (across/down).
 */
export type CrosswordClueEntry = {
  n: number;
  clue: string;
  row: number;
  col: number;
  len: number;
};

export type CrosswordPuzzleJson = {
  rows: number;
  cols: number;
  solution: (string | null)[][];
  clues: {
    across: CrosswordClueEntry[];
    down: CrosswordClueEntry[];
  };
};

export type CrosswordPlayPayload = {
  title: string | null;
  rows: number;
  cols: number;
  blocked: boolean[][];
  /** clue number at cell start (0 if none) */
  clueStarts: { across: number; down: number }[][];
  clues: { across: CrosswordClueEntry[]; down: CrosswordClueEntry[] };
};

function isBlock(cell: string | null | undefined): boolean {
  return cell == null || cell === "#" || cell === "";
}

function normLetter(cell: string | null | undefined): string {
  if (cell == null || isBlock(cell)) return "";
  return String(cell).trim().toUpperCase().slice(0, 1);
}

export function parseCrosswordPuzzleJson(raw: unknown): { ok: true; puzzle: CrosswordPuzzleJson } | { ok: false; error: string } {
  if (raw == null || typeof raw !== "object") return { ok: false, error: "Puzzle must be a JSON object" };
  const o = raw as Record<string, unknown>;
  const rows = Number(o.rows);
  const cols = Number(o.cols);
  if (!Number.isInteger(rows) || rows < 1 || rows > 25) return { ok: false, error: "rows must be 1–25" };
  if (!Number.isInteger(cols) || cols < 1 || cols > 25) return { ok: false, error: "cols must be 1–25" };

  const sol = o.solution;
  if (!Array.isArray(sol) || sol.length !== rows) return { ok: false, error: "solution must be a rows-length array" };
  const solution: (string | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    const row = sol[r];
    if (!Array.isArray(row) || row.length !== cols) return { ok: false, error: `solution row ${r} must have cols entries` };
    const out: (string | null)[] = [];
    for (let c = 0; c < cols; c++) {
      const v = row[c];
      if (v === null || v === "#") {
        out.push(null);
        continue;
      }
      if (typeof v !== "string") return { ok: false, error: `solution[${r}][${c}] must be string, #, or null` };
      const ch = v.trim().toUpperCase();
      if (ch === "" || ch === "#") {
        out.push(null);
      } else if (!/^[A-Z]$/.test(ch)) {
        return { ok: false, error: `solution[${r}][${c}] must be a single letter A–Z` };
      } else {
        out.push(ch);
      }
    }
    solution.push(out);
  }

  const cluesRaw = o.clues;
  if (cluesRaw == null || typeof cluesRaw !== "object") return { ok: false, error: "clues object required" };
  const cr = cluesRaw as Record<string, unknown>;
  const across = cr.across;
  const down = cr.down;
  if (!Array.isArray(across) || !Array.isArray(down)) return { ok: false, error: "clues.across and clues.down must be arrays" };

  const parseClueList = (arr: unknown[], dir: string): CrosswordClueEntry[] => {
    const list: CrosswordClueEntry[] = [];
    for (let i = 0; i < arr.length; i++) {
      const e = arr[i];
      if (e == null || typeof e !== "object") throw new Error(`${dir}[${i}]: invalid entry`);
      const x = e as Record<string, unknown>;
      const n = Number(x.n);
      const clue = typeof x.clue === "string" ? x.clue.trim() : "";
      const row = Number(x.row);
      const col = Number(x.col);
      const len = Number(x.len);
      if (!Number.isInteger(n) || n < 1) throw new Error(`${dir}[${i}]: invalid n`);
      if (!Number.isInteger(row) || row < 0 || row >= rows) throw new Error(`${dir}[${i}]: invalid row`);
      if (!Number.isInteger(col) || col < 0 || col >= cols) throw new Error(`${dir}[${i}]: invalid col`);
      if (!Number.isInteger(len) || len < 1) throw new Error(`${dir}[${i}]: invalid len`);
      list.push({ n, clue, row, col, len });
    }
    return list;
  };

  let acrossList: CrosswordClueEntry[];
  let downList: CrosswordClueEntry[];
  try {
    acrossList = parseClueList(across, "across");
    downList = parseClueList(down, "down");
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid clue" };
  }

  for (const cl of acrossList) {
    for (let k = 0; k < cl.len; k++) {
      const rr = cl.row;
      const cc = cl.col + k;
      if (cc >= cols) return { ok: false, error: `Clue ${cl.n} across out of bounds` };
      if (isBlock(solution[rr][cc])) return { ok: false, error: `Clue ${cl.n} across crosses block` };
    }
  }
  for (const cl of downList) {
    for (let k = 0; k < cl.len; k++) {
      const rr = cl.row + k;
      const cc = cl.col;
      if (rr >= rows) return { ok: false, error: `Clue ${cl.n} down out of bounds` };
      if (isBlock(solution[rr][cc])) return { ok: false, error: `Clue ${cl.n} down crosses block` };
    }
  }

  return {
    ok: true,
    puzzle: { rows, cols, solution, clues: { across: acrossList, down: downList } },
  };
}

export function puzzleToPlayPayload(title: string | null, puzzle: CrosswordPuzzleJson): CrosswordPlayPayload {
  const { rows, cols, solution, clues } = puzzle;
  const blocked: boolean[][] = [];
  const clueStarts: { across: number; down: number }[][] = [];
  for (let r = 0; r < rows; r++) {
    blocked[r] = [];
    clueStarts[r] = [];
    for (let c = 0; c < cols; c++) {
      blocked[r][c] = isBlock(solution[r][c]);
      clueStarts[r][c] = { across: 0, down: 0 };
    }
  }
  for (const cl of clues.across) {
    clueStarts[cl.row][cl.col].across = cl.n;
  }
  for (const cl of clues.down) {
    clueStarts[cl.row][cl.col].down = cl.n;
  }
  return { title, rows, cols, blocked, clueStarts, clues };
}

/** Normalize user grid to uppercase letters; empty string for empty; must match dimensions */
export function normalizeUserGrid(
  raw: unknown,
  rows: number,
  cols: number
): { ok: true; grid: string[][] } | { ok: false; error: string } {
  if (!Array.isArray(raw) || raw.length !== rows) return { ok: false, error: "grid must be rows x cols array" };
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const row = raw[r];
    if (!Array.isArray(row) || row.length !== cols) return { ok: false, error: "grid row length mismatch" };
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      const v = row[c];
      if (v == null || v === "") {
        grid[r][c] = "";
      } else if (typeof v === "string") {
        const ch = v.trim().toUpperCase();
        grid[r][c] = /^[A-Z]$/.test(ch) ? ch : "";
      } else {
        return { ok: false, error: "grid cells must be strings" };
      }
    }
  }
  return { ok: true, grid };
}

export function gridsMatchSolution(userGrid: string[][], puzzle: CrosswordPuzzleJson): boolean {
  const { rows, cols, solution } = puzzle;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isBlock(solution[r][c])) continue;
      const want = normLetter(solution[r][c]);
      const got = userGrid[r][c] ?? "";
      if (got !== want) return false;
    }
  }
  return true;
}

export function isGridComplete(userGrid: string[][], puzzle: CrosswordPuzzleJson): boolean {
  const { rows, cols, solution } = puzzle;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isBlock(solution[r][c])) continue;
      const ch = userGrid[r]?.[c] ?? "";
      if (!/^[A-Z]$/.test(ch)) return false;
    }
  }
  return true;
}
