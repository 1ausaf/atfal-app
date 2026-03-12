"use client";

import { HabitsPage } from "@/components/my-life/habits-page";
import { GoalsPage } from "@/components/my-life/goals-page";
import { StreaksWidget } from "@/components/my-life/streaks-widget";

export function MyLifeDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Row 1: Habit Tracker (full width) */}
      <div className="md:col-span-2 min-h-0">
        <HabitsPage />
      </div>

      {/* Row 2: Streaks (full width) */}
      <div className="md:col-span-2 min-h-0 flex flex-col">
        <StreaksWidget />
      </div>
      {/* Row 3: Goals (full width) */}
      <div className="md:col-span-2 min-h-0 flex flex-col">
        <GoalsPage />
      </div>
    </div>
  );
}
