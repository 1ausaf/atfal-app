"use client";

import { useState, useEffect } from "react";

interface WordRow {
  id: string;
  word: string;
  definition_usage: string | null;
  created_at: string;
}

export function WordleAdminClient() {
  const [words, setWords] = useState<WordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newWord, setNewWord] = useState("");
  const [newDef, setNewDef] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWord, setEditWord] = useState("");
  const [editDef, setEditDef] = useState("");

  const fetchWords = async () => {
    try {
      const res = await fetch("/api/admin/wordle/words");
      if (!res.ok) throw new Error("Failed to load words");
      const data = await res.json();
      setWords(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = newWord.trim().toUpperCase();
    if (!w || (w.length !== 5 && w.length !== 6)) {
      setError("Word must be 5 or 6 letters");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/wordle/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: w, definition_usage: newDef.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add");
      setWords((prev) => [...prev, data]);
      setNewWord("");
      setNewDef("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (row: WordRow) => {
    setEditingId(row.id);
    setEditWord(row.word);
    setEditDef(row.definition_usage ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditWord("");
    setEditDef("");
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const w = editWord.trim().toUpperCase();
    if (!w || (w.length !== 5 && w.length !== 6)) {
      setError("Word must be 5 or 6 letters");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/wordle/words/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: w, definition_usage: editDef.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setWords((prev) => prev.map((r) => (r.id === editingId ? data : r)));
      cancelEdit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this word?")) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/wordle/words/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete");
      }
      setWords((prev) => prev.filter((r) => r.id !== id));
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

      <form onSubmit={handleAdd} className="card-kid p-4 space-y-3">
        <h2 className="font-semibold text-slate-900 dark:text-white">Add word</h2>
        <div className="flex flex-wrap gap-2 items-end">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600 dark:text-slate-400">Word (5 or 6 letters)</span>
            <input
              type="text"
              maxLength={6}
              value={newWord}
              onChange={(e) => setNewWord(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
              className="w-28 px-3 py-2 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
              placeholder="e.g. HELLO"
            />
          </label>
          <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <span className="text-sm text-slate-600 dark:text-slate-400">Definition / usage (optional)</span>
            <input
              type="text"
              value={newDef}
              onChange={(e) => setNewDef(e.target.value)}
              className="w-full px-3 py-2 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
              placeholder="Optional definition or example sentence"
            />
          </label>
          <button
            type="submit"
            disabled={submitting || !newWord.trim()}
            className="px-4 py-2 btn-kid-primary rounded-gta disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </form>

      <div className="card-kid overflow-hidden p-0">
        <ul className="divide-y divide-gta-border">
          {words.length === 0 ? (
            <li className="p-4 text-slate-500 dark:text-slate-400">No words yet. Add 5- or 6-letter words above.</li>
          ) : (
            words.map((row) => (
              <li key={row.id} className="p-4 flex flex-wrap items-center gap-2">
                {editingId === row.id ? (
                  <>
                    <input
                      type="text"
                      maxLength={6}
                      value={editWord}
                      onChange={(e) => setEditWord(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
                      className="w-24 px-2 py-1 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
                    />
                    <input
                      type="text"
                      value={editDef}
                      onChange={(e) => setEditDef(e.target.value)}
                      className="flex-1 min-w-[120px] px-2 py-1 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text text-sm"
                      placeholder="Definition (optional)"
                    />
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={submitting}
                      className="px-2 py-1 btn-kid-primary text-sm rounded-gta-sm disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-2 py-1 border border-gta-border rounded-gta-sm text-sm hover:bg-gta-surfaceSecondary"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">{row.word}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {row.definition_usage ? `— ${row.definition_usage.slice(0, 60)}${row.definition_usage.length > 60 ? "…" : ""}` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      disabled={submitting}
                      className="ml-auto text-sm text-gta-primary hover:underline disabled:opacity-50"
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
                  </>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
