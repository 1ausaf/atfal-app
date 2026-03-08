"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatDateTimeInToronto } from "@/lib/datetime";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  options: { correct?: string; options?: string[] } | null;
  points_value?: number;
};

type Submission = {
  id: string;
  user_id: string;
  name: string | null;
  member_code: string | null;
  answers: Record<string, string>;
  status: string;
  auto_points: number;
  points_awarded: number;
  created_at: string;
};

type Data = {
  activity: { id: string; title: string };
  questions: Question[];
  submissions: Submission[];
};

export function LessonCompletionDetailClient({ activityId }: { activityId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointsEdit, setPointsEdit] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/analytics/lesson-completion/${activityId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setPointsEdit(
          (d.submissions ?? []).reduce(
            (acc: Record<string, number>, s: Submission) => {
              acc[s.id] = s.points_awarded;
              return acc;
            },
            {}
          )
        );
      })
      .catch(() => setError("Failed to load."))
      .finally(() => setLoading(false));
  }, [activityId]);

  async function savePoints(submissionId: string) {
    const value = pointsEdit[submissionId];
    if (value === undefined) return;
    setSavingId(submissionId);
    try {
      const res = await fetch(`/api/lessons/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points_awarded: value }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save");
      }
      setError(null);
      setData((prev) =>
        prev
          ? {
              ...prev,
              submissions: prev.submissions.map((s) =>
                s.id === submissionId
                  ? { ...s, points_awarded: value, status: "graded" }
                  : s
              ),
            }
          : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) return <p className="text-gta-textSecondary">Loading…</p>;
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (!data) return <p className="text-gta-textSecondary">No data.</p>;

  const { activity, questions, submissions } = data;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/analytics/lesson-completion"
        className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline inline-block"
      >
        ← Lesson completion
      </Link>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
        {activity.title}
      </h1>
      <p className="text-slate-600 dark:text-slate-400">
        {submissions.length} Atfal submitted
      </p>

      <div className="space-y-6">
        {submissions.map((sub) => (
          <div key={sub.id} className="card-kid p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 border-b border-gta-border pb-2">
              <span className="font-semibold text-slate-900 dark:text-white">
                {sub.name ?? "—"}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                @{sub.member_code ?? "—"}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {formatDateTimeInToronto(sub.created_at)}
              </span>
              <span className="text-sm px-2 py-0.5 rounded bg-gta-surfaceSecondary text-slate-600 dark:text-slate-400">
                {sub.status}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Auto: {sub.auto_points} pts · Awarded: {sub.points_awarded} pts
              </span>
            </div>

            <div className="space-y-2">
              {questions.map((q) => {
                const userAnswer = sub.answers?.[q.id] ?? "—";
                const isShortQuiz = q.question_type === "short_quiz";
                const correct = (q.options as { correct?: string } | null)?.correct;
                const isCorrect =
                  isShortQuiz &&
                  correct != null &&
                  correct !== "" &&
                  userAnswer === correct;
                const pointsVal =
                  typeof q.points_value === "number" ? q.points_value : 1;
                return (
                  <div
                    key={q.id}
                    className="text-sm border-l-2 border-gta-border pl-3 py-1"
                  >
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      {q.question_text}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Answer: {String(userAnswer)}
                    </p>
                    {isShortQuiz && (
                      <p>
                        {isCorrect ? (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Correct · {pointsVal} pts
                          </span>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">
                            Incorrect · 0 pts
                          </span>
                        )}
                      </p>
                    )}
                    {q.question_type === "long_answer" && (
                      <p className="text-slate-500 dark:text-slate-400">
                        Manual
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gta-border">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Points awarded:
              </label>
              <input
                type="number"
                min={0}
                value={pointsEdit[sub.id] ?? sub.points_awarded}
                onChange={(e) =>
                  setPointsEdit((prev) => ({
                    ...prev,
                    [sub.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                  }))
                }
                className="w-20 px-2 py-1 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
              />
              <button
                type="button"
                onClick={() => savePoints(sub.id)}
                disabled={savingId === sub.id}
                className="px-3 py-1.5 btn-kid-primary text-sm rounded-gta disabled:opacity-50"
              >
                {savingId === sub.id ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {submissions.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400">
          No submissions for this lesson yet.
        </p>
      )}
    </div>
  );
}
