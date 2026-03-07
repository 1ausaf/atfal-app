"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type OptionsShape = { correct?: string; options?: string[] } | null;

export function EditQuestionPoints({
  activityId,
  questionId,
  questionText: initialQuestionText,
  questionType,
  pointsValue: initialPoints,
  options: initialOptions,
}: {
  activityId: string;
  questionId: string;
  questionText: string;
  questionType: string;
  pointsValue: number;
  options?: OptionsShape;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [questionText, setQuestionText] = useState(initialQuestionText);
  const [points, setPoints] = useState(initialPoints);
  const [correctAnswer, setCorrectAnswer] = useState(
    initialOptions?.correct ?? ""
  );
  const [optionsText, setOptionsText] = useState(
    Array.isArray(initialOptions?.options)
      ? initialOptions.options.join("\n")
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function cancelEdit() {
    setEditing(false);
    setQuestionText(initialQuestionText);
    setPoints(initialPoints);
    setCorrectAnswer(initialOptions?.correct ?? "");
    setOptionsText(
      Array.isArray(initialOptions?.options)
        ? initialOptions.options.join("\n")
        : ""
    );
    setError("");
  }

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      const body: {
        question_text: string;
        points_value: number;
        options?: { correct: string; options: string[] };
      } = {
        question_text: questionText.trim(),
        points_value: points,
      };
      if (questionType === "short_quiz") {
        body.options = {
          correct: correctAnswer.trim(),
          options: optionsText
            .split(/[\n,]/)
            .map((s) => s.trim())
            .filter(Boolean),
        };
      }
      const res = await fetch(
        `/api/lessons/${activityId}/questions/${questionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save");
        return;
      }
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {editing ? (
        <div className="space-y-3 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <label className="block text-sm font-medium mb-1 text-gta-text">
              Question text
            </label>
            <input
              type="text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gta-text"
            />
          </div>
          {questionType === "short_quiz" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-gta-text">
                  Options (one per line or comma-separated)
                </label>
                <textarea
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gta-text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gta-text">
                  Correct answer
                </label>
                <input
                  type="text"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gta-text"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-gta-text">
              Points
            </label>
            <input
              type="number"
              min={0}
              value={points}
              onChange={(e) =>
                setPoints(Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gta-text"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-3 py-1.5 text-sm btn-kid-primary rounded-lg disabled:opacity-50"
            >
              {loading ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="px-3 py-1.5 text-sm border border-gta-border rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-gta-text"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gta-text">{questionText}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            ({questionType})
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {initialPoints} pts
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
