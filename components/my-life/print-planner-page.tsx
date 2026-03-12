"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ScheduleBlock {
  id: string;
  day_of_week: number;
  block_type: string;
  label: string | null;
  start_time: string | null;
  end_time: string | null;
}

interface HabitDef {
  id: string;
  label: string;
}

interface Goal {
  id: string;
  title: string;
  target_value: number | null;
  current_value: number;
  status?: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BLOCK_LABELS: Record<string, string> = {
  wake_up: "Wake up",
  fajr: "Fajr",
  school: "School",
  homework: "Homework",
  quran_reading: "Qur'an",
  sports: "Sports",
  family_time: "Family",
  masjid: "Masjid",
  free_time: "Free",
  sleep: "Sleep",
};

export function PrintPlannerPage() {
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [habits, setHabits] = useState<HabitDef[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const d = new Date(today + "T12:00:00");
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    const dates = Array.from({ length: 7 }, (_, i) => {
      const x = new Date(start);
      x.setDate(start.getDate() + i);
      return x.toISOString().slice(0, 10);
    });
    setWeekDates(dates);

    Promise.all([
      fetch("/api/my-life/schedule").then((r) => r.json()),
      fetch("/api/my-life/habits?from=" + dates[0] + "&to=" + dates[6]).then((r) => r.json()),
      fetch("/api/my-life/goals").then((r) => r.json()),
    ]).then(([sched, habData, goalsData]) => {
      setSchedule(Array.isArray(sched) ? sched : []);
      const defs = habData.definitions ?? [];
      setHabits(defs);
      const comp = new Set<string>();
      (habData.completions ?? []).forEach((c: { habitId: string; date: string }) => comp.add(`${c.habitId}-${c.date}`));
      setCompletions(comp);
      setGoals(Array.isArray(goalsData) ? goalsData.filter((g: Goal) => g.status === "active" || !g.status) : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gta-textSecondary dark:text-slate-400">Loading…</p>;

  const byDay = Array.from({ length: 7 }, (_, d) =>
    schedule.filter((b) => b.day_of_week === d).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
  );

  return (
    <div className="print-planner bg-white text-black p-6 rounded-gta max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">My Weekly Planner</h1>
      <p className="text-sm text-gray-600 mb-4">
        {weekDates[0]} – {weekDates[6]} · GTA Centre Atfal
      </p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Schedule</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1 pr-2">Time</th>
              {DAY_NAMES.map((n, i) => (
                <th key={i} className="text-left py-1 px-1">{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {byDay.flatMap((b) => b).length === 0 ? (
              <tr>
                <td colSpan={8} className="py-2 text-gray-500">No schedule added yet.</td>
              </tr>
            ) : (
              Array.from({ length: 24 }, (_, hour) => {
                const row = byDay.map((dayBlocks) =>
                  dayBlocks.find((b) => {
                    const s = b.start_time;
                    if (!s) return false;
                    return parseInt(s.slice(0, 2), 10) === hour;
                  })
                );
                if (row.every((b) => !b)) return null;
                return (
                  <tr key={hour} className="border-b border-gray-100">
                    <td className="py-0.5 pr-2 text-gray-600">{hour}:00</td>
                    {row.map((b, i) => (
                      <td key={i} className="py-0.5 px-1 text-xs">
                        {b ? (b.label || BLOCK_LABELS[b.block_type] || b.block_type) : ""}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Habits this week</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1">Habit</th>
              {weekDates.map((d, i) => (
                <th key={d} className="text-center py-1">{DAY_NAMES[i]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {habits.map((h) => (
              <tr key={h.id} className="border-b border-gray-100">
                <td className="py-0.5">{h.label}</td>
                {weekDates.map((date) => (
                  <td key={date} className="text-center py-0.5">
                    {completions.has(`${h.id}-${date}`) ? "✓" : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Goals</h2>
        <ul className="list-disc list-inside text-sm">
          {goals.length === 0 ? (
            <li className="text-gray-500">No active goals.</li>
          ) : (
            goals.map((g) => (
              <li key={g.id}>
                {g.title} {g.target_value != null ? `(${g.current_value}/${g.target_value})` : ""}
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Notes</h2>
        <div className="border border-gray-300 rounded min-h-[80px] p-2 text-sm text-gray-500">
          {" "}
        </div>
      </section>

      <div className="flex gap-4 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-kid-primary px-4 py-2 rounded-gta"
        >
          Print
        </button>
        <Link href="/my-life" className="link-kid py-2">
          Back to My Life
        </Link>
      </div>
    </div>
  );
}
