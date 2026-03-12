"use client";

import { useState, useEffect } from "react";

interface Badge {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  badge_icon: string | null;
}

interface ProgressData {
  goodDeeds: number;
  longestStreak: number;
  totalHabitsCompleted: number;
  badges: Badge[];
  streaks: { habit_id: string; streak: number; label: string }[];
}

export function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/my-life/progress")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gta-textSecondary dark:text-slate-400">Loading…</p>;
  if (!data) return <p className="text-gta-textSecondary dark:text-slate-400">Could not load progress.</p>;

  return (
    <div className="space-y-6">
      <div className="card-kid p-5">
        <h3 className="text-lg font-bold text-gta-text dark:text-slate-100 mb-4">
          Your progress
        </h3>
        <ul className="space-y-3 text-gta-text dark:text-slate-200">
          <li>
            <span className="font-medium">Good deeds recorded:</span> {data.goodDeeds}
          </li>
          <li>
            <span className="font-medium">Longest streak:</span> {data.longestStreak} day{data.longestStreak !== 1 ? "s" : ""}
          </li>
          <li>
            <span className="font-medium">Total habits completed:</span> {data.totalHabitsCompleted}
          </li>
        </ul>
      </div>

      {data.streaks.length > 0 && (
        <div className="card-kid p-5">
          <h3 className="text-lg font-bold text-gta-text dark:text-slate-100 mb-3">
            Current streaks
          </h3>
          <ul className="space-y-2">
            {data.streaks.map((s) => (
              <li key={s.habit_id} className="text-gta-text dark:text-slate-200">
                {s.label}: <span className="text-gta-primary dark:text-emerald-400 font-semibold">{s.streak} day{s.streak !== 1 ? "s" : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.badges.length > 0 && (
        <div className="card-kid p-5">
          <h3 className="text-lg font-bold text-gta-text dark:text-slate-100 mb-3">
            Badges earned
          </h3>
          <div className="flex flex-wrap gap-4">
            {data.badges.map((b) => (
              <div
                key={b.id}
                className="flex flex-col items-center gap-1 p-3 rounded-gta bg-gta-surfaceSecondary/80 dark:bg-slate-700/80"
              >
                <span className="text-2xl" aria-hidden>
                  {b.badge_icon === "star" ? "⭐" : b.badge_icon === "quran" ? "📖" : b.badge_icon === "heart" ? "❤️" : b.badge_icon === "shield" ? "🛡️" : b.badge_icon === "trophy" ? "🏆" : "⭐"}
                </span>
                <span className="font-semibold text-gta-text dark:text-slate-200 text-sm">{b.label}</span>
                {b.description && (
                  <span className="text-xs text-gta-textSecondary dark:text-slate-400 text-center max-w-[120px]">{b.description}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.badges.length === 0 && data.streaks.length === 0 && data.totalHabitsCompleted === 0 && (
        <p className="text-gta-textSecondary dark:text-slate-400 text-sm">
          Keep tracking your habits and check-ins to see streaks and earn badges here!
        </p>
      )}
    </div>
  );
}
