"use client";

import { SCHEDULE_BLOCK_LABELS } from "@/lib/my-life-types";
import type { ScheduleBlockType } from "@/lib/my-life-types";

interface Block {
  id: string;
  day_of_week: number;
  block_type: ScheduleBlockType;
  label: string | null;
  start_time: string | null;
  end_time: string | null;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function SchedulePrintView({ blocks }: { blocks: Block[] }) {
  const byDay = Array.from({ length: 7 }, (_, d) =>
    blocks.filter((b) => b.day_of_week === d).sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""))
  );

  return (
    <div className="schedule-print bg-white text-black p-6 rounded-gta">
      <h1 className="text-2xl font-bold mb-4 print:mb-2">My Weekly Schedule</h1>
      <p className="text-sm text-gray-600 mb-6 print:mb-4">GTA Centre Atfal – My Life</p>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-2 pr-4 font-semibold">Time</th>
            {DAY_NAMES.map((name, i) => (
              <th key={i} className="text-left py-2 px-2 font-semibold">{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {byDay.flatMap((dayBlocks) => dayBlocks).length === 0 ? (
            <tr>
              <td colSpan={8} className="py-4 text-gray-500 text-center">
                Add your schedule in My Life to see it here.
              </td>
            </tr>
          ) : (
            Array.from({ length: 24 }, (_, hour) => {
              const rows = byDay.map((dayBlocks, d) =>
                dayBlocks.find((b) => {
                  const s = b.start_time;
                  if (!s) return false;
                  const [h] = s.split(":").map(Number);
                  return h === hour;
                })
              );
              const hasAny = rows.some(Boolean);
              if (!hasAny) return null;
              return (
                <tr key={hour} className="border-b border-gray-200">
                  <td className="py-2 pr-4 text-gray-600">{hour}:00</td>
                  {rows.map((b, d) => (
                    <td key={d} className="py-1 px-2">
                      {b ? (
                        <span>
                          {b.start_time ?? ""}–{b.end_time ?? ""} {b.label || SCHEDULE_BLOCK_LABELS[b.block_type]}
                        </span>
                      ) : null}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <div className="mt-6 print:mt-4 flex justify-between items-center">
        <button
          type="button"
          onClick={() => window.print()}
          className="btn-kid-primary px-4 py-2 rounded-gta print:hidden"
        >
          Print
        </button>
        <a href="/my-life/schedule" className="text-sm link-kid print:hidden">
          Back to Schedule
        </a>
      </div>
    </div>
  );
}
