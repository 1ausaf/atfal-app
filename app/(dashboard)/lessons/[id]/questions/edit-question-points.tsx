"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EditQuestionPoints({
  activityId,
  questionId,
  questionText,
  questionType,
  pointsValue: initialPoints,
}: {
  activityId: string;
  questionId: string;
  questionText: string;
  questionType: string;
  pointsValue: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [points, setPoints] = useState(initialPoints);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${activityId}/questions/${questionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points_value: points }),
      });
      if (res.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-medium">{questionText}</span>
      <span className="text-sm text-slate-500 dark:text-slate-400">({questionType})</span>
      <span className="text-sm text-slate-600 dark:text-slate-300">{initialPoints} pts</span>
      {editing ? (
        <>
          <input
            type="number"
            min={0}
            value={points}
            onChange={(e) => setPoints(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700"
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-2 py-1 text-sm btn-kid-primary rounded-lg disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setPoints(initialPoints); }}
            className="px-2 py-1 text-sm border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Edit points
        </button>
      )}
    </div>
  );
}
