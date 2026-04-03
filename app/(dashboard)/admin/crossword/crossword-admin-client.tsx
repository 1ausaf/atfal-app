"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CROSSWORD_MIN_ACROSS_CLUES,
  CROSSWORD_MIN_DOWN_CLUES,
  parseCrosswordPuzzleJson,
} from "@/lib/crossword";
import { extractWordListsFromPuzzle } from "@/lib/crossword-build";

type Entry = { word: string; clue: string };

interface PuzzleRow {
  id: string;
  title: string | null;
  puzzle_json: unknown;
  created_at: string;
}

function emptyEntries(n: number): Entry[] {
  return Array.from({ length: n }, () => ({ word: "", clue: "" }));
}

function filledEntries(rows: Entry[]): Entry[] {
  return rows.filter((r) => r.word.trim() && r.clue.trim());
}

export function CrosswordAdminClient() {
  const [rows, setRows] = useState<PuzzleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newAcross, setNewAcross] = useState<Entry[]>(() => emptyEntries(CROSSWORD_MIN_ACROSS_CLUES));
  const [newDown, setNewDown] = useState<Entry[]>(() => emptyEntries(CROSSWORD_MIN_DOWN_CLUES));
  const [newAdvancedOpen, setNewAdvancedOpen] = useState(false);
  const [newJson, setNewJson] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAcross, setEditAcross] = useState<Entry[]>([]);
  const [editDown, setEditDown] = useState<Entry[]>([]);
  const [editAdvancedOpen, setEditAdvancedOpen] = useState(false);
  const [editJson, setEditJson] = useState("");
  const [editHydrateNote, setEditHydrateNote] = useState<string | null>(null);

  const fetchRows = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/crossword/puzzles");
      if (!res.ok) throw new Error("Failed to load puzzles");
      const data = await res.json();
      setRows(data);
      setError(null);
      setSuccessMsg(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const newFilledA = filledEntries(newAcross);
  const newFilledD = filledEntries(newDown);
  const newBuilderOk =
    newFilledA.length >= CROSSWORD_MIN_ACROSS_CLUES && newFilledD.length >= CROSSWORD_MIN_DOWN_CLUES;

  const validateNewSubmit = (): string | null => {
    if (newAdvancedOpen && newJson.trim()) {
      try {
        JSON.parse(newJson);
      } catch {
        return "Advanced JSON is not valid JSON.";
      }
      return null;
    }
    if (newAdvancedOpen && !newJson.trim()) {
      return "Close Advanced or paste puzzle JSON, or fill the word lists.";
    }
    if (!newBuilderOk) {
      return `Add at least ${CROSSWORD_MIN_ACROSS_CLUES} across and ${CROSSWORD_MIN_DOWN_CLUES} down entries (word + hint each).`;
    }
    for (const r of newAcross) {
      if (r.word.trim() && !r.clue.trim()) return "Each across row with a word needs a hint.";
      if (!r.word.trim() && r.clue.trim()) return "Remove hints from empty across rows or add a word.";
    }
    for (const r of newDown) {
      if (r.word.trim() && !r.clue.trim()) return "Each down row with a word needs a hint.";
      if (!r.word.trim() && r.clue.trim()) return "Remove hints from empty down rows or add a word.";
    }
    return null;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateNewSubmit();
    if (v) {
      setError(v);
      setSuccessMsg(null);
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const useJson = Boolean(newAdvancedOpen && newJson.trim());
      const body = useJson
        ? { title: newTitle.trim() || null, puzzle_json: JSON.parse(newJson) as unknown }
        : {
            title: newTitle.trim() || null,
            across: newFilledA,
            down: newFilledD,
          };
      const res = await fetch("/api/admin/crossword/puzzles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setRows((prev) => [...prev, data]);
      setNewTitle("");
      setNewAcross(emptyEntries(CROSSWORD_MIN_ACROSS_CLUES));
      setNewDown(emptyEntries(CROSSWORD_MIN_DOWN_CLUES));
      setNewJson("");
      setNewAdvancedOpen(false);
      setSuccessMsg(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSubmitting(false);
    }
  };

  const previewNew = async () => {
    const v = validateNewSubmit();
    if (v) {
      setError(v);
      setSuccessMsg(null);
      return;
    }
    if (newAdvancedOpen && newJson.trim()) {
      setError("Preview uses the word lists. Close advanced JSON or use lists only.");
      setSuccessMsg(null);
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/crossword/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ across: newFilledA, down: newFilledD }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview failed");
      setSuccessMsg("Layout OK — you can save this puzzle.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed");
      setSuccessMsg(null);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (row: PuzzleRow) => {
    setEditingId(row.id);
    setEditTitle(row.title ?? "");
    setEditAdvancedOpen(false);
    setEditJson(JSON.stringify(row.puzzle_json, null, 2));
    setEditHydrateNote(null);

    const parsed = parseCrosswordPuzzleJson(row.puzzle_json);
    if (parsed.ok) {
      try {
        const { across, down } = extractWordListsFromPuzzle(parsed.puzzle);
        setEditAcross(
          across.length >= CROSSWORD_MIN_ACROSS_CLUES
            ? across.map((x) => ({ ...x }))
            : [...across.map((x) => ({ ...x })), ...emptyEntries(CROSSWORD_MIN_ACROSS_CLUES - across.length)]
        );
        setEditDown(
          down.length >= CROSSWORD_MIN_DOWN_CLUES
            ? down.map((x) => ({ ...x }))
            : [...down.map((x) => ({ ...x })), ...emptyEntries(CROSSWORD_MIN_DOWN_CLUES - down.length)]
        );
      } catch {
        setEditAcross(emptyEntries(CROSSWORD_MIN_ACROSS_CLUES));
        setEditDown(emptyEntries(CROSSWORD_MIN_DOWN_CLUES));
        setEditHydrateNote("Could not load words from this puzzle. Use Advanced JSON to edit.");
        setEditAdvancedOpen(true);
      }
    } else {
      setEditAcross(emptyEntries(CROSSWORD_MIN_ACROSS_CLUES));
      setEditDown(emptyEntries(CROSSWORD_MIN_DOWN_CLUES));
      setEditHydrateNote("Stored puzzle failed validation. Fix via Advanced JSON.");
      setEditAdvancedOpen(true);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditAcross([]);
    setEditDown([]);
    setEditJson("");
    setEditAdvancedOpen(false);
    setEditHydrateNote(null);
  };

  const editFilledA = filledEntries(editAcross);
  const editFilledD = filledEntries(editDown);
  const editBuilderOk =
    editFilledA.length >= CROSSWORD_MIN_ACROSS_CLUES && editFilledD.length >= CROSSWORD_MIN_DOWN_CLUES;

  const handleUpdate = async () => {
    if (!editingId) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (editAdvancedOpen && editJson.trim()) {
        let puzzle_json: unknown;
        try {
          puzzle_json = JSON.parse(editJson);
        } catch {
          throw new Error("Invalid JSON in puzzle definition");
        }
        const res = await fetch(`/api/admin/crossword/puzzles/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle.trim() || null,
            puzzle_json,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update");
        setRows((prev) => prev.map((r) => (r.id === editingId ? data : r)));
        cancelEdit();
        return;
      }

      if (!editBuilderOk) {
        throw new Error(
          `Need at least ${CROSSWORD_MIN_ACROSS_CLUES} across and ${CROSSWORD_MIN_DOWN_CLUES} down entries (word + hint each), or use Advanced JSON.`
        );
      }
      for (const r of editAcross) {
        if (r.word.trim() && !r.clue.trim()) throw new Error("Each across row with a word needs a hint.");
        if (!r.word.trim() && r.clue.trim()) throw new Error("Across: add a word or clear the hint.");
      }
      for (const r of editDown) {
        if (r.word.trim() && !r.clue.trim()) throw new Error("Each down row with a word needs a hint.");
        if (!r.word.trim() && r.clue.trim()) throw new Error("Down: add a word or clear the hint.");
      }

      const res = await fetch(`/api/admin/crossword/puzzles/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim() || null,
          across: editFilledA,
          down: editFilledD,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setRows((prev) => prev.map((r) => (r.id === editingId ? data : r)));
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this crossword?")) return;
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/crossword/puzzles/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setSubmitting(false);
    }
  };

  const entryList = (
    label: string,
    items: Entry[],
    setItems: React.Dispatch<React.SetStateAction<Entry[]>>,
    min: number
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        <button
          type="button"
          onClick={() => setItems((prev) => [...prev, { word: "", clue: "" }])}
          className="text-xs text-gta-primary hover:underline"
        >
          Add row
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((row, i) => (
          <li key={i} className="flex flex-wrap gap-2 items-start">
            <input
              type="text"
              value={row.word}
              onChange={(e) =>
                setItems((prev) => {
                  const next = [...prev];
                  next[i] = { ...next[i]!, word: e.target.value };
                  return next;
                })
              }
              placeholder="Word"
              className="flex-1 min-w-[6rem] px-2 py-1.5 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text font-mono text-sm uppercase"
              spellCheck={false}
            />
            <input
              type="text"
              value={row.clue}
              onChange={(e) =>
                setItems((prev) => {
                  const next = [...prev];
                  next[i] = { ...next[i]!, clue: e.target.value };
                  return next;
                })
              }
              placeholder="Hint"
              className="flex-[2] min-w-[10rem] px-2 py-1.5 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text text-sm"
            />
            <button
              type="button"
              disabled={items.length <= min}
              onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
              className="text-xs text-red-600 hover:underline disabled:opacity-30 disabled:no-underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  if (loading) return <p className="text-slate-600 dark:text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
      {successMsg && <p className="text-emerald-700 dark:text-emerald-400 text-sm">{successMsg}</p>}

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Daily puzzles must have at least <strong>{CROSSWORD_MIN_ACROSS_CLUES} across</strong> and{" "}
        <strong>{CROSSWORD_MIN_DOWN_CLUES} down</strong> clues. Enter words and hints; the server builds the grid. Words
        should share letters where they cross—otherwise layout may fail. Puzzles are cycled in{" "}
        <strong>creation order</strong> using the same Toronto &quot;Wordle day&quot; as Wordle.
      </p>

      <form onSubmit={handleAdd} className="card-kid p-4 space-y-4">
        <h2 className="font-semibold text-slate-900 dark:text-white">Add crossword</h2>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-600 dark:text-slate-400">Title (optional)</span>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
            placeholder="e.g. Week 3"
          />
        </label>

        {entryList("Across", newAcross, setNewAcross, CROSSWORD_MIN_ACROSS_CLUES)}
        {entryList("Down", newDown, setNewDown, CROSSWORD_MIN_DOWN_CLUES)}
        {!newBuilderOk && !(newJson.trim() && newAdvancedOpen) && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Fill at least {CROSSWORD_MIN_ACROSS_CLUES} across and {CROSSWORD_MIN_DOWN_CLUES} down (word + hint), or paste
            valid JSON in Advanced (when open).
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={submitting || (newAdvancedOpen ? !newJson.trim() : !newBuilderOk)}
            className="px-4 py-2 btn-kid-primary rounded-gta disabled:opacity-50"
          >
            Add puzzle
          </button>
          <button
            type="button"
            disabled={submitting || !newBuilderOk || !!(newJson.trim() && newAdvancedOpen)}
            onClick={() => void previewNew()}
            className="px-4 py-2 border border-gta-border rounded-gta text-sm hover:bg-gta-surfaceSecondary disabled:opacity-50"
          >
            Preview layout
          </button>
        </div>

        <details
          className="border border-gta-border rounded-gta-sm p-3 bg-gta-surfaceSecondary/30"
          open={newAdvancedOpen}
          onToggle={(e) => setNewAdvancedOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer text-sm font-medium text-slate-800 dark:text-slate-200">
            Advanced: import JSON
          </summary>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-2">
            Paste full <code className="text-[10px]">puzzle_json</code>. Must meet daily minimums. If this panel is{" "}
            <strong>open</strong> and the textarea is <strong>non-empty</strong>, Add uses JSON instead of the lists.
          </p>
          <textarea
            value={newJson}
            onChange={(e) => setNewJson(e.target.value)}
            rows={10}
            className="w-full font-mono text-xs px-3 py-2 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text mt-2"
            spellCheck={false}
          />
        </details>
      </form>

      <div className="card-kid overflow-hidden p-0">
        <ul className="divide-y divide-gta-border">
          {rows.length === 0 ? (
            <li className="p-4 text-slate-500 dark:text-slate-400">No puzzles yet.</li>
          ) : (
            rows.map((row) => (
              <li key={row.id} className="p-4 space-y-2">
                {editingId === row.id ? (
                  <div className="space-y-4">
                    {editHydrateNote && (
                      <p className="text-xs text-amber-700 dark:text-amber-300">{editHydrateNote}</p>
                    )}
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full max-w-md px-2 py-1 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
                      placeholder="Title"
                    />
                    {!editAdvancedOpen ? (
                      <>
                        {entryList("Across", editAcross, setEditAcross, CROSSWORD_MIN_ACROSS_CLUES)}
                        {entryList("Down", editDown, setEditDown, CROSSWORD_MIN_DOWN_CLUES)}
                      </>
                    ) : null}
                    <details
                      className="border border-gta-border rounded-gta-sm p-3"
                      open={editAdvancedOpen}
                      onToggle={(e) => setEditAdvancedOpen((e.target as HTMLDetailsElement).open)}
                    >
                      <summary className="cursor-pointer text-sm font-medium">Advanced JSON</summary>
                      <textarea
                        value={editJson}
                        onChange={(e) => setEditJson(e.target.value)}
                        rows={12}
                        className="w-full font-mono text-xs px-2 py-1 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text mt-2"
                        spellCheck={false}
                      />
                    </details>
                    <p className="text-xs text-slate-500">
                      If Advanced JSON is open and the textarea is not empty, Save uses JSON. Otherwise Save rebuilds from
                      word lists.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleUpdate()}
                        disabled={submitting}
                        className="px-3 py-1 btn-kid-primary text-sm rounded-gta-sm disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1 border border-gta-border rounded-gta-sm text-sm hover:bg-gta-surfaceSecondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-white">{row.title ?? "(no title)"}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {new Date(row.created_at).toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      disabled={submitting}
                      className="text-sm text-gta-primary hover:underline disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(row.id)}
                      disabled={submitting}
                      className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
