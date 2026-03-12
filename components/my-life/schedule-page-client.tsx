"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SCHEDULE_BLOCK_LABELS } from "@/lib/my-life-types";
import type { ScheduleBlockType } from "@/lib/my-life-types";

interface ScheduleBlock {
  id: string;
  user_id: string;
  day_of_week: number;
  block_type: ScheduleBlockType;
  label: string | null;
  start_time: string | null;
  end_time: string | null;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const BLOCK_TYPES: ScheduleBlockType[] = [
  "wake_up", "fajr", "school", "homework", "quran_reading",
  "sports", "family_time", "masjid", "free_time", "sleep", "custom",
];

function to24h(hour: number, amPm: "AM" | "PM", minute: number): string {
  let h = hour;
  if (amPm === "AM") h = hour === 12 ? 0 : hour;
  else h = hour === 12 ? 12 : hour + 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function format12h(time24: string | null): string {
  if (!time24) return "—";
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr ?? "0", 10);
  const m = parseInt(mStr ?? "0", 10);
  const amPm = h < 12 ? "AM" : "PM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${amPm}`;
}

export function SchedulePageClient() {
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay());
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newBlock, setNewBlock] = useState({
    block_type: "wake_up" as ScheduleBlockType,
    label: "",
    startHour: 9,
    startAmPm: "AM" as "AM" | "PM",
    startMinute: 0,
    endHour: 10,
    endAmPm: "AM" as "AM" | "PM",
    endMinute: 0,
  });

  useEffect(() => {
    setLoading(true);
    if (view === "weekly") {
      fetch("/api/my-life/schedule")
        .then((r) => r.json())
        .then((data) => setBlocks(Array.isArray(data) ? data : []))
        .catch(() => setBlocks([]))
        .finally(() => setLoading(false));
    } else {
      fetch(`/api/my-life/schedule?day_of_week=${selectedDay}`)
        .then((r) => r.json())
        .then((data) => setBlocks(Array.isArray(data) ? data : []))
        .catch(() => setBlocks([]))
        .finally(() => setLoading(false));
    }
  }, [view, selectedDay]);

  function addBlock() {
    if (newBlock.block_type === "custom" && !newBlock.label.trim()) return;
    setAdding(true);
    const startTime = to24h(newBlock.startHour, newBlock.startAmPm, newBlock.startMinute);
    const endTime = to24h(newBlock.endHour, newBlock.endAmPm, newBlock.endMinute);
    fetch("/api/my-life/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        day_of_week: selectedDay,
        block_type: newBlock.block_type,
        label: newBlock.block_type === "custom" ? newBlock.label.trim() : (newBlock.label || null),
        start_time: startTime,
        end_time: endTime,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setBlocks((prev) => [...prev, data].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")));
        setNewBlock({
          block_type: "wake_up",
          label: "",
          startHour: 9,
          startAmPm: "AM",
          startMinute: 0,
          endHour: 10,
          endAmPm: "AM",
          endMinute: 0,
        });
        setAdding(false);
      })
      .catch(() => setAdding(false));
  }

  function deleteBlock(id: string) {
    if (!confirm("Remove this block?")) return;
    fetch(`/api/my-life/schedule/${id}`, { method: "DELETE" })
      .then((r) => { if (r.ok) setBlocks((prev) => prev.filter((b) => b.id !== id)); });
  }

  const dailyBlocks = view === "daily" ? blocks : blocks.filter((b) => b.day_of_week === selectedDay);
  const byDay = view === "weekly"
    ? Array.from({ length: 7 }, (_, d) => blocks.filter((b) => b.day_of_week === d))
    : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setView("daily")}
          className={`px-3 py-1.5 rounded-gta-sm text-sm font-medium ${view === "daily" ? "btn-kid-primary" : "bg-gta-surfaceSecondary dark:bg-slate-700 text-gta-text dark:text-slate-200"}`}
        >
          Daily
        </button>
        <button
          type="button"
          onClick={() => setView("weekly")}
          className={`px-3 py-1.5 rounded-gta-sm text-sm font-medium ${view === "weekly" ? "btn-kid-primary" : "bg-gta-surfaceSecondary dark:bg-slate-700 text-gta-text dark:text-slate-200"}`}
        >
          Weekly
        </button>
        {view === "daily" && (
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(Number(e.target.value))}
            className="rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-3 py-1.5"
          >
            {DAY_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
        )}
        <Link
          href="/my-life/schedule/print"
          className="ml-auto text-sm link-kid"
        >
          Print My Schedule
        </Link>
      </div>

      {loading ? (
        <p className="text-gta-textSecondary dark:text-slate-400">Loading…</p>
      ) : view === "weekly" ? (
        <div className="card-kid p-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-gta-border dark:border-slate-600">
                <th className="text-left py-2 pr-4 text-gta-textSecondary dark:text-slate-400">Time</th>
                {DAY_NAMES.map((name, i) => (
                  <th key={i} className="text-left py-2 px-2 text-gta-text dark:text-slate-200">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byDay && Array.from({ length: 24 }, (_, hour) => {
                const rows = byDay.flatMap((dayBlocks, d) =>
                  dayBlocks.filter((b) => {
                    const s = b.start_time;
                    if (!s) return false;
                    const [h] = s.split(":").map(Number);
                    return h === hour;
                  }).map((b) => ({ day: d, block: b }))
                );
                if (rows.length === 0) return null;
                return (
                  <tr key={hour} className="border-b border-gta-border/50 dark:border-slate-600/50">
                    <td className="py-2 pr-4 text-gta-textSecondary dark:text-slate-400">{hour}:00</td>
                    {DAY_NAMES.map((_, d) => {
                      const cell = rows.find((r) => r.day === d);
                      return (
                        <td key={d} className="py-1 px-2">
                          {cell ? (
                            <span className="text-xs">
                              {cell.block.label || SCHEDULE_BLOCK_LABELS[cell.block.block_type]}
                            </span>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card-kid p-4">
          <h4 className="font-semibold text-gta-text dark:text-slate-100 mb-3">
            {DAY_NAMES[selectedDay]}
          </h4>
          <ul className="space-y-2 mb-4">
            {dailyBlocks
              .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
              .map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-2 py-1 border-b border-gta-border/50 dark:border-slate-600/50">
                  <span className="text-gta-textSecondary dark:text-slate-400 text-sm shrink-0">
                    {format12h(b.start_time)} – {format12h(b.end_time)}
                  </span>
                  <span className="text-gta-text dark:text-slate-200">
                    {b.label || SCHEDULE_BLOCK_LABELS[b.block_type]}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteBlock(b.id)}
                    className="text-red-600 dark:text-red-400 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
          </ul>
          {!adding ? (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="btn-kid-primary text-sm px-3 py-1.5 rounded-gta-sm"
            >
              Add block
            </button>
          ) : (
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-gta-textSecondary dark:text-slate-400 mb-1">Type</label>
                <select
                  value={newBlock.block_type}
                  onChange={(e) => setNewBlock((p) => ({ ...p, block_type: e.target.value as ScheduleBlockType }))}
                  className="rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-2 py-1 text-sm"
                >
                  {BLOCK_TYPES.map((t) => (
                    <option key={t} value={t}>{SCHEDULE_BLOCK_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              {newBlock.block_type === "custom" && (
                <div>
                  <label className="block text-xs text-gta-textSecondary dark:text-slate-400 mb-1">Name (e.g. Play Roblox)</label>
                  <input
                    type="text"
                    value={newBlock.label}
                    onChange={(e) => setNewBlock((p) => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. Play Roblox"
                    className="rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-2 py-1 text-sm min-w-[140px]"
                  />
                </div>
              )}
              <div className="flex gap-1 items-end">
                <div>
                  <label className="block text-xs text-gta-textSecondary dark:text-slate-400 mb-1">Start</label>
                  <div className="flex gap-0.5">
                    <select
                      value={newBlock.startHour}
                      onChange={(e) => setNewBlock((p) => ({ ...p, startHour: Number(e.target.value) }))}
                      className="rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-1 py-1 text-sm w-12"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select
                      value={newBlock.startAmPm}
                      onChange={(e) => setNewBlock((p) => ({ ...p, startAmPm: e.target.value as "AM" | "PM" }))}
                      className="rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-1 py-1 text-sm w-12"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                    <select
                      value={newBlock.startMinute}
                      onChange={(e) => setNewBlock((p) => ({ ...p, startMinute: Number(e.target.value) }))}
                      className="rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-1 py-1 text-sm w-14"
                    >
                      <option value={0}>:00</option>
                      <option value={15}>:15</option>
                      <option value={30}>:30</option>
                      <option value={45}>:45</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 items-end">
                <div>
                  <label className="block text-xs text-gta-textSecondary dark:text-slate-400 mb-1">End</label>
                  <div className="flex gap-0.5">
                    <select
                      value={newBlock.endHour}
                      onChange={(e) => setNewBlock((p) => ({ ...p, endHour: Number(e.target.value) }))}
                      className="rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-1 py-1 text-sm w-12"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select
                      value={newBlock.endAmPm}
                      onChange={(e) => setNewBlock((p) => ({ ...p, endAmPm: e.target.value as "AM" | "PM" }))}
                      className="rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-1 py-1 text-sm w-12"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                    <select
                      value={newBlock.endMinute}
                      onChange={(e) => setNewBlock((p) => ({ ...p, endMinute: Number(e.target.value) }))}
                      className="rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-1 py-1 text-sm w-14"
                    >
                      <option value={0}>:00</option>
                      <option value={15}>:15</option>
                      <option value={30}>:30</option>
                      <option value={45}>:45</option>
                    </select>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={addBlock}
                disabled={newBlock.block_type === "custom" && !newBlock.label.trim()}
                className="btn-kid-primary text-sm px-3 py-1.5 rounded-gta-sm disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="text-sm text-gta-textSecondary dark:text-slate-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
