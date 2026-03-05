"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GradeSubmissionButton({ submissionId, autoPoints }: { submissionId: string; autoPoints: number }) {
  const router = useRouter();
  const [manualPoints, setManualPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  async function handleGrade() {
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual_points: manualPoints }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">Auto (MC): {autoPoints} pts</span>
      <input
        type="number"
        min={0}
        value={manualPoints}
        onChange={(e) => setManualPoints(Math.max(0, parseInt(e.target.value, 10) || 0))}
        placeholder="Manual"
        className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700"
      />
      <button
        type="button"
        onClick={handleGrade}
        disabled={loading}
        className="px-3 py-1.5 btn-kid-primary text-sm rounded-xl disabled:opacity-50 disabled:transform-none"
      >
        Award points
      </button>
    </div>
  );
}
