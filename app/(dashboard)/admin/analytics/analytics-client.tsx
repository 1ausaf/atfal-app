"use client";

import { useState, useEffect } from "react";
import { getTodayToronto } from "@/lib/datetime";

type Row = { majlis_id: string; majlis_name: string; active_count: number };

export function AnalyticsClient() {
  const [date, setDate] = useState(() => getTodayToronto());
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
        <label htmlFor="date" className="block text-sm font-semibold text-gta-text mb-1">
          Date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
        />
      </div>
      {loading && <p className="text-gta-textSecondary">Loading…</p>}
      {!loading && data && (
        <div className="card-kid overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gta-border bg-gta-surfaceSecondary/80">
                <th className="text-left px-4 py-3 font-bold text-gta-text">Majlis</th>
                <th className="text-right px-4 py-3 font-bold text-gta-text">Active Tifls</th>
              </tr>
            </thead>
            <tbody>
              {data.by_majlis.map((r) => (
                <tr key={r.majlis_id} className="border-b border-gta-border">
                  <td className="px-4 py-3 text-gta-text">{r.majlis_name}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gta-primary">{r.active_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
