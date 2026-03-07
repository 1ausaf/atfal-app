"use client";

import { useState, useEffect } from "react";

type Row = {
  activity_id: string;
  title: string;
  completion_count: number;
};

export function LessonCompletionClient() {
  const [data, setData] = useState<{ activities: Row[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/analytics/lesson-completion")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gta-textSecondary">Loading…</p>;
  if (!data) return <p className="text-gta-textSecondary">Failed to load.</p>;
  return (
    <div className="card-kid overflow-hidden p-0">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gta-border bg-gta-surfaceSecondary/80">
            <th className="text-left px-4 py-3 font-bold text-gta-text">
              Lesson activity
            </th>
            <th className="text-right px-4 py-3 font-bold text-gta-text">
              Atfal completed
            </th>
          </tr>
        </thead>
        <tbody>
          {data.activities.map((r) => (
            <tr key={r.activity_id} className="border-b border-gta-border">
              <td className="px-4 py-3 text-gta-text">{r.title}</td>
              <td className="px-4 py-3 text-right font-semibold text-gta-primary">
                {r.completion_count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
