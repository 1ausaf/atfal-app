"use client";

import { useState, useEffect } from "react";
import { getTodayToronto } from "@/lib/datetime";

interface HabitDef {
  id: string;
  slug: string;
  label: string;
  icon_name: string | null;
  sort_order: number;
  is_mandatory?: boolean;
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

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const GOALS_CHANGED_EVENT = "my-life-goals-changed";
const HABITS_CHANGED_EVENT = "my-life-habits-changed";

export function HabitsPage() {
  const [weekStart, setWeekStart] = useState(() => getTodayToronto());
  const [refreshKey, setRefreshKey] = useState(0);
  const weekDates = getWeekDates(weekStart);
  const [definitions, setDefinitions] = useState<HabitDef[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener(GOALS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(GOALS_CHANGED_EVENT, handler);
  }, []);

  useEffect(() => {
    const dates = getWeekDates(weekStart);
    const from = dates[0];
    const to = dates[6];
    fetch(`/api/my-life/habits?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((data) => {
        const defs = (data.definitions ?? []).slice();
        defs.sort((a: HabitDef, b: HabitDef) => {
          const aMandatory = a.is_mandatory ? 1 : 0;
          const bMandatory = b.is_mandatory ? 1 : 0;
          if (bMandatory !== aMandatory) return bMandatory - aMandatory;
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        });
        setDefinitions(defs);
        const set = new Set<string>();
        (data.completions ?? []).forEach((c: { habitId: string; date: string }) => {
          set.add(`${c.habitId}-${c.date}`);
        });
        setCompletions(set);
      })
      .finally(() => setLoading(false));
  }, [weekStart, refreshKey]);

  function toggle(habitId: string, date: string) {
    const key = `${habitId}-${date}`;
    const isCompleted = completions.has(key);
    const url = "/api/my-life/habits/complete";
    if (isCompleted) {
      fetch(`${url}?habit_id=${habitId}&date=${date}`, { method: "DELETE" }).then(() => {
        setCompletions((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        window.dispatchEvent(new Event(HABITS_CHANGED_EVENT));
      });
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_id: habitId, date }),
      }).then(() => {
        setCompletions((prev) => new Set(prev).add(key));
        window.dispatchEvent(new Event(HABITS_CHANGED_EVENT));
      });
    }
  }

  function prevWeek() {
    const d = new Date(weekDates[0] + "T12:00:00");
    d.setDate(d.getDate() - 7);
    setWeekStart(d.toISOString().slice(0, 10));
  }
  function nextWeek() {
    const d = new Date(weekDates[0] + "T12:00:00");
    d.setDate(d.getDate() + 7);
    setWeekStart(d.toISOString().slice(0, 10));
  }

  if (loading) return <p className="text-gta-textSecondary dark:text-slate-400">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={prevWeek}
          className="text-gta-primary dark:text-emerald-400 font-medium hover:underline"
        >
          ← Previous week
        </button>
        <span className="text-gta-text dark:text-slate-200 text-sm">
          {weekDates[0]} – {weekDates[6]}
        </span>
        <button
          type="button"
          onClick={nextWeek}
          className="text-gta-primary dark:text-emerald-400 font-medium hover:underline"
        >
          Next week →
        </button>
      </div>
      <div className="card-kid p-4 overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead>
            <tr className="border-b border-gta-border dark:border-slate-600">
              <th className="text-left py-2 pr-4 text-gta-text dark:text-slate-200 font-semibold">
                Habit
              </th>
              {weekDates.map((date, i) => (
                <th key={date} className="text-center py-2 px-1 text-gta-textSecondary dark:text-slate-400 font-medium">
                  {DAY_LABELS[i]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {definitions.map((h) => (
              <tr key={h.id} className="border-b border-gta-border/50 dark:border-slate-600/50">
                <td className="py-2 pr-4 text-gta-text dark:text-slate-200">
                  {h.label}
                  {h.is_mandatory && (
                    <span className="ml-1.5 text-xs text-gta-textSecondary dark:text-slate-400 font-normal" title="Required for all tifls">
                      (Required)
                    </span>
                  )}
                </td>
                {weekDates.map((date) => {
                  const key = `${h.id}-${date}`;
                  const done = completions.has(key);
                  return (
                    <td key={date} className="py-1 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(h.id, date)}
                        className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center mx-auto transition-colors ${
                          done
                            ? "bg-gta-primary border-gta-primary text-green-900 dark:bg-emerald-500 dark:border-emerald-500 dark:text-white"
                            : "border-gta-border dark:border-slate-600 hover:border-gta-primary dark:hover:border-emerald-400"
                        }`}
                        aria-label={done ? `Mark ${h.label} for ${date} as not done` : `Mark ${h.label} for ${date} as done`}
                      >
                        {done ? "✓" : ""}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
