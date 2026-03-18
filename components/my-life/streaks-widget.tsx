"use client";

import { useState, useEffect } from "react";

interface StreakItem {
  habit_id: string;
  streak: number;
  label: string;
}

interface ProgressData {
  streaks: StreakItem[];
}

export function StreaksWidget() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/my-life/progress", { cache: "no-store" });
        const j = await r.json();
        if (alive) setData(j);
      } catch {
        if (alive) setData(null);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();

    const handler = () => load();
    window.addEventListener("my-life-habits-changed", handler);
    return () => {
      alive = false;
      window.removeEventListener("my-life-habits-changed", handler);
    };
  }, []);

  if (loading) return <p className="text-gta-textSecondary dark:text-slate-400 text-sm">Loading…</p>;
  if (!data) return <p className="text-gta-textSecondary dark:text-slate-400 text-sm">Could not load streaks.</p>;

  const streaks = data.streaks ?? [];

  return (
    <div className="card-kid p-4">
      <h3 className="font-semibold text-gta-text dark:text-slate-100 mb-3 flex items-center gap-2">
        <span className="inline-block w-5 h-5 shrink-0" aria-hidden>
          <svg viewBox="0 0 24 24" fill="currentColor" className="text-amber-500 dark:text-amber-400 w-5 h-5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </span>
        Streaks
      </h3>
      {streaks.length === 0 ? (
        <p className="text-gta-textSecondary dark:text-slate-400 text-sm">
          No streaks yet – track habits to build them!
        </p>
      ) : (
        <ul className="space-y-2">
          {streaks.map((s) => (
            <li key={s.habit_id} className="text-gta-text dark:text-slate-200 text-sm flex justify-between gap-2">
              <span>{s.label}</span>
              <span className="font-semibold text-gta-primary dark:text-emerald-400">
                {s.streak} day{s.streak !== 1 ? "s" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
