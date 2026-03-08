"use client";

import { useState, useEffect, useCallback } from "react";

const ROWS = 6;
const CORRECT = "#7ED321";
const MISPLACED = "#F5A623";
const ABSENT = "#9ca3af";

type LetterStatus = "correct" | "misplaced" | "absent";

interface RowState {
  letters: string;
  statuses: LetterStatus[];
}

export function WordleGame() {
  const [wordLength, setWordLength] = useState<number>(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<RowState[]>(() =>
    Array(ROWS).fill(null).map(() => ({ letters: "", statuses: [] }))
  );
  const [currentRow, setCurrentRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showLearnModal, setShowLearnModal] = useState(false);
  const [definitionUsage, setDefinitionUsage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [howToPlayImageError, setHowToPlayImageError] = useState(false);

  useEffect(() => {
    fetch("/api/wordle/daily")
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 503 ? "No words configured yet." : "Failed to load.");
        return res.json();
      })
      .then((data) => {
        setWordLength(data.wordLength ?? 5);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const fetchDefinition = useCallback(async (word: string) => {
    try {
      const res = await fetch(`/api/wordle/definition?word=${encodeURIComponent(word)}`);
      const data = await res.json();
      setDefinitionUsage(data.definitionUsage ?? "No definition available.");
    } catch {
      setDefinitionUsage("Could not load definition.");
    }
  }, []);

  const submitGuess = useCallback(async () => {
    const guess = currentGuess.trim().toUpperCase();
    if (guess.length !== wordLength || submitting || gameOver) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/wordle/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess, guessNumber: currentRow + 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Invalid guess");
        setSubmitting(false);
        return;
      }
      setError(null);

      const statuses = (data.feedback ?? []) as LetterStatus[];
      setRows((prev) => {
        const next = [...prev];
        next[currentRow] = { letters: guess, statuses };
        return next;
      });
      setCurrentGuess("");
      setCurrentRow((r) => r + 1);

      if (data.solved || data.answer) {
        setGameOver(true);
        setAnswer(data.answer ?? guess);
        await fetchDefinition(data.answer ?? guess);
        setShowLearnModal(true);
      } else if (currentRow + 1 >= ROWS) {
        setGameOver(true);
        setAnswer(data.answer ?? null);
        if (data.answer) {
          await fetchDefinition(data.answer);
          setShowLearnModal(true);
        }
      }
    } catch (e) {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }, [currentGuess, currentRow, wordLength, submitting, gameOver, fetchDefinition]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (showHowToPlay || showLearnModal) {
        if (e.key === "Escape") {
          setShowHowToPlay(false);
          setShowLearnModal(false);
        }
        return;
      }
      if (gameOver) return;
      if (e.key === "Enter") {
        submitGuess();
        return;
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        setCurrentGuess((g) => g.slice(0, -1));
        return;
      }
      if (e.key.length === 1 && /^[A-Za-z]$/.test(e.key)) {
        e.preventDefault();
        setCurrentGuess((g) => (g.length < wordLength ? g + e.key.toUpperCase() : g));
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [wordLength, gameOver, submitGuess, showHowToPlay, showLearnModal]);

  if (loading) {
    return (
      <div className="rounded-gta shadow-gta bg-gta-surface border border-gta-border p-8 text-center text-gta-textSecondary">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-gta shadow-gta bg-gta-surface border border-gta-border p-8 text-center text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  const currentRowData = rows[currentRow];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      <div
        className="w-full flex-1 rounded-adventure shadow-gta bg-gta-surface border border-gta-border p-6"
      >
        <div className="flex flex-col gap-2 mb-6">
          {rows.slice(0, ROWS).map((row, r) => (
            <div key={r} className="flex justify-center gap-1.5">
              {Array.from({ length: wordLength }, (_, i) => {
                const letter =
                  r === currentRow ? (currentGuess[i] ?? "") : (row.letters[i] ?? "");
                const status = row.statuses[i];
                let bg = "bg-gray-200 dark:bg-slate-600 border-gray-300 dark:border-slate-500";
                if (status === "correct") bg = "border-transparent";
                if (status === "misplaced") bg = "border-transparent";
                if (status === "absent") bg = "border-transparent";
                const bgStyle =
                  status === "correct"
                    ? { backgroundColor: CORRECT }
                    : status === "misplaced"
                    ? { backgroundColor: MISPLACED }
                    : status === "absent"
                    ? { backgroundColor: ABSENT }
                    : undefined;
                return (
                  <div
                    key={i}
                    className={`inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded border-2 text-xl font-bold uppercase text-slate-900 dark:text-white ${!bgStyle ? bg : ""}`}
                    style={bgStyle}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {!gameOver && (
          <div className="flex justify-center gap-2">
            <input
              type="text"
              maxLength={wordLength}
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && submitGuess()}
              className="w-48 px-3 py-2 border-2 border-gta-border rounded-gta bg-gta-surface text-gta-text text-center text-xl uppercase"
              placeholder={`${wordLength} letters`}
              disabled={submitting}
              aria-label="Your guess"
            />
            <button
              type="button"
              onClick={submitGuess}
              disabled={currentGuess.length !== wordLength || submitting}
              className="px-4 py-2 btn-kid-primary rounded-gta disabled:opacity-50"
            >
              Guess
            </button>
          </div>
        )}

        {error && <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      <button
        type="button"
        onClick={() => setShowHowToPlay(true)}
        className="shrink-0 px-4 py-2 rounded-gta border-2 border-gta-primary text-gta-primary hover:bg-gta-surfaceSecondary transition-colors font-semibold"
      >
        How to play
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
                // eslint-disable-next-line @next/next/no-img-element -- dynamic src with onError fallback
                <img
                  src="/wordle-how-to-play.png"
                  alt="How to play Wordle"
                  className="w-full h-auto rounded-lg"
                  onError={() => setHowToPlayImageError(true)}
                />
              ) : null}
              {howToPlayImageError ? (
                <div className="text-slate-700 dark:text-slate-300 space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">How To Play</h3>
                  <p>Guess the Wordle in 6 tries.</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Each guess must be a valid 5- or 6-letter word (depending on the day).</li>
                    <li>The color of the tiles will change to show how close your guess was to the word.</li>
                  </ul>
                  <p className="font-semibold mt-2">Examples</p>
                  <p><span className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-400 bg-[#7ED321] text-sm font-bold text-slate-900">W</span> is in the word and in the correct spot.</p>
                  <p><span className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-400 bg-[#F5A623] text-sm font-bold text-slate-900">I</span> is in the word but in the wrong spot.</p>
                  <p><span className="inline-flex h-8 w-8 items-center justify-center rounded border border-slate-400 bg-gray-500 text-white text-sm font-bold">U</span> is not in the word in any spot.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {showLearnModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowLearnModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Learn about the word"
        >
          <div
            className="relative rounded-gta shadow-gta bg-gta-surface border border-gta-border max-w-lg w-full max-h-[90vh] overflow-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLearnModal(false)}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-gta-surfaceSecondary hover:bg-gta-border flex items-center justify-center text-gta-text"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              {answer ? `"${answer}"` : "Today's word"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{definitionUsage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
