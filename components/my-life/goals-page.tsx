"use client";

import { useState, useEffect } from "react";
import { getTodayToronto } from "@/lib/datetime";

interface Goal {
  id: string;
  title: string;
  description?: string | null;
  target_type: string;
  target_value: number | null;
  current_value: number;
  status: string;
  due_date?: string | null;
  habits?: { id: string; label: string }[];
}

interface HabitDef {
  id: string;
  label: string;
}

function getWeekDates(refDate: string): string[] {
  const d = new Date(refDate + "T12:00:00");
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

const SUGGESTIONS = [
  "Losing weight",
  "Memorize a surah",
  "Pray all prayers for 30 days",
  "Read Qur'an every day this week",
];

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<HabitDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [selectedHabitIds, setSelectedHabitIds] = useState<Set<string>>(new Set());
  const [newHabitLabels, setNewHabitLabels] = useState<string[]>([]);
  const [newHabitInput, setNewHabitInput] = useState("");

  function load() {
    fetch("/api/my-life/goals")
      .then((r) => r.json())
      .then((data) => setGoals(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const today = getTodayToronto();
    const [from] = getWeekDates(today);
    const to = getWeekDates(today)[6];
    fetch(`/api/my-life/habits?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => setHabits((data.definitions ?? []).map((d: { id: string; label: string }) => ({ id: d.id, label: d.label }))));
  }, [goals]);

  function toggleHabitForGoal(id: string) {
    setSelectedHabitIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addNewHabitLabel() {
    const label = newHabitInput.trim();
    if (!label) return;
    setNewHabitLabels((prev) => [...prev, label]);
    setNewHabitInput("");
  }

  function removeNewHabitLabel(index: number) {
    setNewHabitLabels((prev) => prev.filter((_, i) => i !== index));
  }

  function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    fetch("/api/my-life/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        target_type: "custom",
        target_value: newTarget ? parseInt(newTarget, 10) : null,
        due_date: newDueDate || null,
        habit_definition_ids: Array.from(selectedHabitIds),
        new_habit_labels: newHabitLabels,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          load();
          setNewTitle("");
          setNewDescription("");
          setNewTarget("");
          setNewDueDate("");
          setSelectedHabitIds(new Set());
          setNewHabitLabels([]);
          window.dispatchEvent(new CustomEvent("my-life-goals-changed"));
        }
        setAdding(false);
      })
      .catch(() => setAdding(false));
  }

  function updateProgress(id: string, delta: number) {
    const g = goals.find((x) => x.id === id);
    if (!g) return;
    const next = Math.max(0, g.current_value + delta);
    fetch(`/api/my-life/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_value: next }),
    }).then(() => setGoals((prev) => prev.map((x) => (x.id === id ? { ...x, current_value: next } : x))));
  }

  function completeGoal(id: string) {
    if (!confirm("Mark this goal as completed?")) return;
    fetch(`/api/my-life/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    }).then(() => setGoals((prev) => prev.filter((x) => x.id !== id)));
  }

  const activeGoals = goals.filter((g) => g.status === "active");

  if (loading) return <p className="text-gta-textSecondary dark:text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="card-kid p-4">
        <h3 className="font-semibold text-gta-text dark:text-slate-100 mb-3">Add a goal</h3>
        <form onSubmit={addGoal} className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Memorize Surah Al-Fatiha"
              className="flex-1 min-w-[200px] rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-3 py-2 text-sm"
            />
            <input
            type="number"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="Target (optional)"
            min={0}
            className="w-24 rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-3 py-2 text-sm"
          />
          <div>
            <label className="block text-xs text-gta-textSecondary dark:text-slate-400 mb-0.5">Be done by</label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" disabled={adding} className="btn-kid-primary px-4 py-2 rounded-gta-sm text-sm">
            {adding ? "Adding…" : "Add goal"}
          </button>
          </div>
          <div>
            <label className="block text-xs text-gta-textSecondary dark:text-slate-400 mb-0.5">Description (optional)</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="e.g. I want to finish by Ramadan and practice with my teacher"
              rows={2}
              className="w-full rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-3 py-2 text-sm resize-y"
            />
          </div>
        </form>
        <div className="mt-3">
          <p className="text-xs font-medium text-gta-text dark:text-slate-200 mb-2">Habits that will help achieve this goal</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {habits.map((h) => (
              <label key={h.id} className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedHabitIds.has(h.id)}
                  onChange={() => toggleHabitForGoal(h.id)}
                  className="rounded border-gta-border dark:border-slate-600"
                />
                <span className="text-sm text-gta-text dark:text-slate-200">{h.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <input
              type="text"
              value={newHabitInput}
              onChange={(e) => setNewHabitInput(e.target.value)}
              placeholder="e.g. Exercising daily"
              className="rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-2 py-1.5 text-sm w-40"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNewHabitLabel())}
            />
            <button type="button" onClick={addNewHabitLabel} className="text-sm text-gta-primary dark:text-emerald-400 hover:underline">
              Add new habit
            </button>
          </div>
          {newHabitLabels.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-1">
              {newHabitLabels.map((label, i) => (
                <li key={i} className="text-sm px-2 py-0.5 rounded bg-gta-surfaceSecondary dark:bg-slate-700 text-gta-text dark:text-slate-200 flex items-center gap-1">
                  {label}
                  <button type="button" onClick={() => removeNewHabitLabel(i)} className="text-gta-textSecondary hover:text-red-600" aria-label="Remove">×</button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-gta-textSecondary dark:text-slate-400 mt-2">Suggestions:</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setNewTitle(s)}
              className="text-xs px-2 py-1 rounded bg-gta-surfaceSecondary dark:bg-slate-700 text-gta-text dark:text-slate-300 hover:bg-gta-primary/20 dark:hover:bg-emerald-500/20"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="card-kid p-4">
        <h3 className="font-semibold text-gta-text dark:text-slate-100 mb-3">My goals</h3>
        {activeGoals.length === 0 ? (
          <p className="text-gta-textSecondary dark:text-slate-400 text-sm">
            No goals yet. Add one above to get started!
          </p>
        ) : (
          <ul className="space-y-3">
            {activeGoals.map((g) => {
              const today = new Date().toISOString().slice(0, 10);
              const due = g.due_date;
              const isOverdue = due && g.status === "active" && due < today;
              const dueLabel = due
                ? (() => {
                    const d = new Date(due + "T12:00:00");
                    const days = Math.ceil((d.getTime() - new Date(today + "T12:00:00").getTime()) / (24 * 60 * 60 * 1000));
                    if (days < 0) return "Overdue";
                    if (days === 0) return "Due today";
                    if (days === 1) return "Due tomorrow";
                    return `Due in ${days} days`;
                  })()
                : null;
              return (
              <li
                key={g.id}
                className={`py-2 border-b border-gta-border/50 dark:border-slate-600/50 last:border-0 ${isOverdue ? "text-amber-600 dark:text-amber-400" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex-1 min-w-[120px] text-gta-text dark:text-slate-200 font-medium">{g.title}</span>
                {dueLabel && (
                  <span className={`text-sm ${isOverdue ? "font-medium" : "text-gta-textSecondary dark:text-slate-400"}`}>
                    {dueLabel}
                    {due && !isOverdue && ` (${new Date(due + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })})`}
                  </span>
                )}
                {g.target_value != null ? (
                  <span className="text-gta-textSecondary dark:text-slate-400 text-sm">
                    {g.current_value} / {g.target_value}
                  </span>
                ) : (
                  <span className="text-gta-textSecondary dark:text-slate-400 text-sm">{g.current_value}</span>
                )}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => updateProgress(g.id, -1)}
                    className="w-8 h-8 rounded border border-gta-border dark:border-slate-600 text-gta-text dark:text-slate-200 hover:bg-gta-surfaceSecondary dark:hover:bg-slate-700"
                  >
                    −
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProgress(g.id, 1)}
                    className="w-8 h-8 rounded border border-gta-border dark:border-slate-600 text-gta-text dark:text-slate-200 hover:bg-gta-surfaceSecondary dark:hover:bg-slate-700"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => completeGoal(g.id)}
                    className="text-sm text-gta-primary dark:text-emerald-400 hover:underline"
                  >
                    Done
                  </button>
                </div>
                </div>
                {g.description && (
                  <p className="text-sm text-gta-textSecondary dark:text-slate-400 mt-1">{g.description}</p>
                )}
                {g.habits && g.habits.length > 0 && (
                  <p className="text-xs text-gta-textSecondary dark:text-slate-400 mt-1 ml-0">
                    Habits: {g.habits.map((h) => h.label).join(", ")}
                  </p>
                )}
              </li>
            );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
