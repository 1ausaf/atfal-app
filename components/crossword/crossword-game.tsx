"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePointsEarnedToast } from "@/components/points-earned-toast";

type Clue = { n: number; clue: string; row: number; col: number; len: number };

type TodayPayload = {
  wordleDay: string;
  title: string | null;
  rows: number;
  cols: number;
  blocked: boolean[][];
  clueStarts: { across: number; down: number }[][];
  clues: { across: Clue[]; down: Clue[] };
  alreadyCompleted: boolean;
  pointsPerCompletion: number;
  pointsEarnedToday: number | null;
};

function emptyGrid(rows: number, cols: number, blocked: boolean[][]): string[][] {
  const g: string[][] = [];
  for (let r = 0; r < rows; r++) {
    g[r] = [];
    for (let c = 0; c < cols; c++) {
      g[r][c] = blocked[r]?.[c] ? "" : "";
    }
  }
  return g;
}

function buildClueNumberMaps(p: TodayPayload) {
  const acrossN: number[][] = Array.from({ length: p.rows }, () => Array<number>(p.cols).fill(0));
  const downN: number[][] = Array.from({ length: p.rows }, () => Array<number>(p.cols).fill(0));
  for (const cl of p.clues.across) {
    for (let k = 0; k < cl.len; k++) {
      const c = cl.col + k;
      if (cl.row >= 0 && cl.row < p.rows && c >= 0 && c < p.cols) acrossN[cl.row]![c] = cl.n;
    }
  }
  for (const cl of p.clues.down) {
    for (let k = 0; k < cl.len; k++) {
      const r = cl.row + k;
      if (r >= 0 && r < p.rows && cl.col >= 0 && cl.col < p.cols) downN[r]![cl.col] = cl.n;
    }
  }
  return { acrossN, downN };
}

export function CrosswordGame() {
  const { showPointsEarned } = usePointsEarnedToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<TodayPayload | null>(null);
  const [grid, setGrid] = useState<string[][]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [howToPlayImageError, setHowToPlayImageError] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [lastPoints, setLastPoints] = useState<number | null>(null);
  const [completeWasEligible, setCompleteWasEligible] = useState(false);
  const [correctAcrossNs, setCorrectAcrossNs] = useState<Set<number>>(() => new Set());
  const [correctDownNs, setCorrectDownNs] = useState<Set<number>>(() => new Set());
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  const clueMaps = useMemo(() => (payload ? buildClueNumberMaps(payload) : null), [payload]);

  const setCellRef = useCallback((r: number, c: number, el: HTMLInputElement | null) => {
    const k = `${r}-${c}`;
    if (el) inputRefs.current.set(k, el);
    else inputRefs.current.delete(k);
  }, []);

  const loadToday = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crossword/today");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load crossword");
      setPayload(data as TodayPayload);
      const p = data as TodayPayload;
      setGrid(emptyGrid(p.rows, p.cols, p.blocked));
      setCorrectAcrossNs(new Set());
      setCorrectDownNs(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setPayload(null);
      setGrid([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const focusCell = useCallback((r: number, c: number) => {
    const el = inputRefs.current.get(`${r}-${c}`);
    el?.focus();
    el?.select();
  }, []);

  const nextOpenCell = useCallback(
    (r: number, c: number, dr: number, dc: number, p: TodayPayload): [number, number] | null => {
      let nr = r + dr;
      let nc = c + dc;
      while (nr >= 0 && nr < p.rows && nc >= 0 && nc < p.cols) {
        if (!p.blocked[nr][nc]) return [nr, nc];
        nr += dr;
        nc += dc;
      }
      return null;
    },
    []
  );

  const handleCellChange = useCallback(
    (r: number, c: number, v: string, p: TodayPayload) => {
      const ch = v.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(-1) ?? "";
      setGrid((prev) => {
        const next = prev.map((row) => [...row]);
        if (!next[r]) return prev;
        next[r][c] = ch;
        return next;
      });
      if (ch && p) {
        const n = nextOpenCell(r, c, 0, 1, p);
        if (n) setTimeout(() => focusCell(n[0], n[1]), 0);
      }
    },
    [focusCell, nextOpenCell]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, r: number, c: number, p: TodayPayload) => {
      if (e.key === "Backspace" && !grid[r]?.[c]) {
        const prev = nextOpenCell(r, c, 0, -1, p);
        if (prev) {
          e.preventDefault();
          focusCell(prev[0], prev[1]);
        }
        return;
      }
      const moves: Record<string, [number, number]> = {
        ArrowRight: [0, 1],
        ArrowLeft: [0, -1],
        ArrowDown: [1, 0],
        ArrowUp: [-1, 0],
      };
      const d = moves[e.key];
      if (d) {
        e.preventDefault();
        let nr = r + d[0];
        let nc = c + d[1];
        while (nr >= 0 && nr < p.rows && nc >= 0 && nc < p.cols) {
          if (!p.blocked[nr][nc]) {
            focusCell(nr, nc);
            return;
          }
          nr += d[0];
          nc += d[1];
        }
      }
    },
    [focusCell, grid, nextOpenCell]
  );

  const handleSubmit = async () => {
    if (!payload || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/crossword/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grid }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Submit failed");
        return;
      }
      if (!data.correct) {
        setSubmitError("Not quite right — check your letters and try again.");
        const wf = data.wordFeedback as { across?: number[]; down?: number[] } | undefined;
        if (wf) {
          if (Array.isArray(wf.across)) {
            setCorrectAcrossNs((prev) => {
              const next = new Set(prev);
              for (const n of wf.across!) next.add(n);
              return next;
            });
          }
          if (Array.isArray(wf.down)) {
            setCorrectDownNs((prev) => {
              const next = new Set(prev);
              for (const n of wf.down!) next.add(n);
              return next;
            });
          }
        }
        return;
      }
      const pts = typeof data.pointsAwarded === "number" ? data.pointsAwarded : 0;
      setLastPoints(pts);
      setCompleteWasEligible(payload.pointsPerCompletion > 0);
      setCompleteOpen(true);
      if (pts > 0) showPointsEarned(pts);
      await loadToday();
    } catch {
      setSubmitError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-slate-600 dark:text-slate-400">Loading crossword…</p>;
  if (error || !payload)
    return (
      <div className="rounded-gta border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200">
        {error ?? "No puzzle available."}
      </div>
    );

  const p = payload;
  const maps = clueMaps!;
  const sortedAcross = [...p.clues.across].sort((a, b) => a.n - b.n);
  const sortedDown = [...p.clues.down].sort((a, b) => a.n - b.n);

  const cellInputBg = (r: number, c: number): string => {
    const an = maps.acrossN[r]?.[c] ?? 0;
    const dn = maps.downN[r]?.[c] ?? 0;
    const aOk = an > 0 && correctAcrossNs.has(an);
    const dOk = dn > 0 && correctDownNs.has(dn);
    if (aOk && dOk) return "bg-emerald-200/90 dark:bg-emerald-900/45";
    if (aOk) return "bg-emerald-100/95 dark:bg-emerald-950/40";
    if (dOk) return "bg-sky-100/95 dark:bg-sky-950/35";
    return "bg-transparent";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowHowToPlay(true)}
          className="px-4 py-2 rounded-gta border-2 border-gta-border text-gta-text hover:bg-gta-surfaceSecondary transition-colors font-semibold"
        >
          How to play
        </button>
        <button
          type="button"
          onClick={() => {
            setGrid(emptyGrid(p.rows, p.cols, p.blocked));
            setSubmitError(null);
            setCorrectAcrossNs(new Set());
            setCorrectDownNs(new Set());
          }}
          className="px-4 py-2 rounded-gta border-2 border-gta-border text-gta-text hover:bg-gta-surfaceSecondary transition-colors font-semibold"
        >
          Clear grid
        </button>
      </div>

      {p.alreadyCompleted && (
        <div className="rounded-gta border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 p-4 text-amber-900 dark:text-amber-100 text-sm">
          You already completed today&apos;s crossword
          {p.pointsEarnedToday != null && p.pointsEarnedToday > 0
            ? ` and earned ${p.pointsEarnedToday} points.`
            : "."}{" "}
          Come back after the next crossword day starts at <strong>9:00 AM Toronto</strong> for a new puzzle.
        </div>
      )}

      {p.title && <p className="text-lg font-semibold text-gta-text">{p.title}</p>}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div
          className="inline-grid gap-px bg-slate-800 dark:bg-slate-600 p-px rounded-lg"
          style={{
            gridTemplateColumns: `repeat(${p.cols}, minmax(2rem, 2.25rem))`,
          }}
        >
          {Array.from({ length: p.rows }, (_, r) =>
            Array.from({ length: p.cols }, (_, c) => {
              if (p.blocked[r][c]) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 dark:bg-black"
                    aria-hidden
                  />
                );
              }
              const cs = p.clueStarts[r][c];
              return (
                <div key={`${r}-${c}`} className="relative w-9 h-9 sm:w-10 sm:h-10 bg-white dark:bg-slate-800">
                  {(cs.across > 0 || cs.down > 0) && (
                    <span className="absolute left-0.5 top-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-none z-10">
                      {cs.across || cs.down}
                    </span>
                  )}
                  <input
                    ref={(el) => setCellRef(r, c, el)}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={grid[r]?.[c] ?? ""}
                    onChange={(e) => handleCellChange(r, c, e.target.value, p)}
                    onKeyDown={(e) => handleKeyDown(e, r, c, p)}
                    disabled={p.alreadyCompleted}
                    className={`absolute inset-0 w-full h-full text-center text-base font-bold uppercase pt-3 border-0 text-slate-900 dark:text-white focus:ring-2 focus:ring-gta-primary focus:z-20 rounded-none disabled:opacity-60 ${cellInputBg(r, c)}`}
                    aria-label={`Cell row ${r + 1} column ${c + 1}`}
                  />
                </div>
              );
            })
          ).flat()}
        </div>

        <div className="flex-1 min-w-0 space-y-4 text-sm">
          {sortedAcross.length > 0 && (
            <div>
              <h3 className="font-bold text-gta-text mb-2">Across</h3>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                {sortedAcross.map((cl) => (
                  <li key={`a-${cl.n}`}>
                    <span className="font-semibold text-gta-primary">{cl.n}.</span> {cl.clue}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {sortedDown.length > 0 && (
            <div>
              <h3 className="font-bold text-gta-text mb-2">Down</h3>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                {sortedDown.map((cl) => (
                  <li key={`d-${cl.n}`}>
                    <span className="font-semibold text-gta-primary">{cl.n}.</span> {cl.clue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {submitError && (
        <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
          {submitError}{" "}
          <span className="text-slate-600 dark:text-slate-400 font-normal">
            (A fully correct across or down word is highlighted after submit; partial words are not.)
          </span>
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || p.alreadyCompleted}
        className="px-6 py-3 btn-kid-primary rounded-gta font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Checking…" : "Submit crossword"}
      </button>

      {showHowToPlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowHowToPlay(false)}
          role="dialog"
          aria-modal="true"
          aria-label="How to play"
        >
          <div
            className="relative rounded-gta shadow-gta bg-gta-surface border border-gta-border max-w-lg w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-gta-surfaceSecondary hover:bg-gta-border flex items-center justify-center text-gta-text"
              aria-label="Close"
            >
              ×
            </button>
            <div className="p-4">
              {!howToPlayImageError ? (
                // eslint-disable-next-line @next/next/no-img-element -- optional asset with fallback
                <img
                  src="/crossword-how-to-play.png"
                  alt="How to play crossword"
                  className="w-full h-auto rounded-lg"
                  onError={() => setHowToPlayImageError(true)}
                />
              ) : null}
              {howToPlayImageError ? (
                <div className="text-slate-700 dark:text-slate-300 space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">How to play</h3>
                  <p>Fill in the white squares using the Across and Down clues.</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Tap a square and type a letter. Use arrow keys to move around the grid.</li>
                    <li>When every white square is filled, press <strong>Submit crossword</strong>.</li>
                    <li>
                      <strong>Tifl:</strong> your first correct completion each crossword day earns{" "}
                      <strong>50 points</strong>. The next puzzle starts at <strong>9:00 AM Toronto</strong> time.
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {completeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setCompleteOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Puzzle complete"
        >
          <div
            className="relative rounded-gta shadow-gta bg-gta-surface border border-gta-border max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setCompleteOpen(false)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-gta-surfaceSecondary hover:bg-gta-border flex items-center justify-center text-gta-text"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Correct!</h2>
            {lastPoints != null && lastPoints > 0 && (
              <p className="text-emerald-600 dark:text-emerald-400 font-semibold mb-2">
                You earned {lastPoints} points!
              </p>
            )}
            {lastPoints === 0 && completeWasEligible && (
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                No points this time — you already earned today&apos;s 50 pts. Next crossword day starts at 9:00 AM
                Toronto.
              </p>
            )}
            {lastPoints === 0 && !completeWasEligible && (
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                Points are awarded to Tifl accounts for the first correct solve each crossword day.
              </p>
            )}
            <button
              type="button"
              onClick={() => setCompleteOpen(false)}
              className="mt-4 px-4 py-2 btn-kid-primary rounded-gta"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
