"use client";

import { useState, useEffect } from "react";

const DEFAULT_JSON = `{
  "rows": 1,
  "cols": 5,
  "solution": [["H","E","L","L","O"]],
  "clues": {
    "across": [{"n": 1, "clue": "A friendly greeting", "row": 0, "col": 0, "len": 5}],
    "down": []
  }
}`;

interface PuzzleRow {
  id: string;
  title: string | null;
  puzzle_json: unknown;
  created_at: string;
}

export function CrosswordAdminClient() {
  const [rows, setRows] = useState<PuzzleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newJson, setNewJson] = useState(DEFAULT_JSON);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editJson, setEditJson] = useState("");

  const fetchRows = async () => {
    try {
      const res = await fetch("/api/admin/crossword/puzzles");
      if (!res.ok) throw new Error("Failed to load puzzles");
      const data = await res.json();
      setRows(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const parseBodyJson = (text: string): unknown => {
    return JSON.parse(text) as unknown;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let puzzle_json: unknown;
      try {
        puzzle_json = parseBodyJson(newJson);
      } catch {
        throw new Error("Invalid JSON in puzzle definition");
      }
      const res = await fetch("/api/admin/crossword/puzzles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim() || null,
          puzzle_json,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setRows((prev) => [...prev, data]);
      setNewTitle("");
      setNewJson(DEFAULT_JSON);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (row: PuzzleRow) => {
    setEditingId(row.id);
    setEditTitle(row.title ?? "");
    setEditJson(JSON.stringify(row.puzzle_json, null, 2));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditJson("");
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setSubmitting(true);
    setError(null);
    try {
      let puzzle_json: unknown;
      try {
        puzzle_json = parseBodyJson(editJson);
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

  if (loading) return <p className="text-slate-600 dark:text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Puzzles are cycled in <strong>creation order</strong>. The daily puzzle is chosen by date (same 9:00 AM Toronto
        &quot;Wordle day&quot; as Wordle). JSON must include <code className="text-xs">rows</code>,{" "}
        <code className="text-xs">cols</code>, <code className="text-xs">solution</code> (grid of letters,{" "}
        <code className="text-xs">#</code> or <code className="text-xs">null</code> for black squares), and{" "}
        <code className="text-xs">clues.across</code> / <code className="text-xs">clues.down</code> with{" "}
        <code className="text-xs">n</code>, <code className="text-xs">clue</code>, <code className="text-xs">row</code>,{" "}
        <code className="text-xs">col</code>, <code className="text-xs">len</code>.
      </p>

      <form onSubmit={handleAdd} className="card-kid p-4 space-y-3">
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
        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-600 dark:text-slate-400">Puzzle JSON</span>
          <textarea
            value={newJson}
            onChange={(e) => setNewJson(e.target.value)}
            rows={14}
            className="w-full font-mono text-sm px-3 py-2 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
            spellCheck={false}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 btn-kid-primary rounded-gta disabled:opacity-50"
        >
          Add puzzle
        </button>
      </form>

      <div className="card-kid overflow-hidden p-0">
        <ul className="divide-y divide-gta-border">
          {rows.length === 0 ? (
            <li className="p-4 text-slate-500 dark:text-slate-400">No puzzles yet.</li>
          ) : (
            rows.map((row) => (
              <li key={row.id} className="p-4 space-y-2">
                {editingId === row.id ? (
                  <>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full max-w-md px-2 py-1 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
                      placeholder="Title"
                    />
                    <textarea
                      value={editJson}
                      onChange={(e) => setEditJson(e.target.value)}
                      rows={12}
                      className="w-full font-mono text-xs px-2 py-1 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
                      spellCheck={false}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleUpdate}
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
                  </>
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
                      onClick={() => handleDelete(row.id)}
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
