"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddQuestionForm({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<"short_quiz" | "long_answer">("short_quiz");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [optionsText, setOptionsText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const options =
      questionType === "short_quiz"
        ? {
            correct: correctAnswer.trim(),
            options: optionsText
              .split(/[\n,]/)
              .map((s) => s.trim())
              .filter(Boolean),
          }
        : null;
    try {
      const res = await fetch(`/api/lessons/${activityId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_text: questionText.trim(),
          question_type: questionType,
          order: 0,
          options,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to add");
        setLoading(false);
        return;
      }
      router.refresh();
      setQuestionText("");
      setCorrectAnswer("");
      setOptionsText("");
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
      <h2 className="font-semibold">Add question</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Question text</label>
        <input
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value as "short_quiz" | "long_answer")}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        >
          <option value="short_quiz">Short quiz (auto-grade)</option>
          <option value="long_answer">Long answer (manual grade)</option>
        </select>
      </div>
      {questionType === "short_quiz" && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Options (one per line or comma-separated)</label>
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Correct answer</label>
            <input
              type="text"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
            />
          </div>
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors">
        Add question
      </button>
    </form>
  );
}
