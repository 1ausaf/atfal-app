"use client";

import { useState, useEffect } from "react";

type Row = { majlis_id: string; majlis_name: string; active_count: number };

export function AnalyticsClient() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<{ date: string; by_majlis: Row[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics/active-by-majlis?date=${date}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
        />
      </div>
      {loading && <p className="text-slate-500">Loading…</p>}
      {!loading && data && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 font-medium text-slate-800 dark:text-slate-200">Majlis</th>
                <th className="text-right px-4 py-3 font-medium text-slate-800 dark:text-slate-200">Active Tifls</th>
              </tr>
            </thead>
            <tbody>
              {data.by_majlis.map((r) => (
                <tr key={r.majlis_id} className="border-b border-slate-100 dark:border-slate-700/50">
                  <td className="px-4 py-3">{r.majlis_name}</td>
                  <td className="px-4 py-3 text-right font-medium">{r.active_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
