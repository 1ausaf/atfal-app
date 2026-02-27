"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  order: number;
  options: { correct?: string; options?: string[] } | null;
}

interface Activity {
  id: string;
  title: string;
  link: string | null;
  type: string;
}

interface LessonContentProps {
  activity: Activity;
  questions: Question[];
  existingSubmission: { status: string; points_awarded: number } | null;
  isTifl: boolean;
}

export function LessonContent({ activity, questions, existingSubmission, isTifl }: LessonContentProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isYouTube = activity.link?.includes("youtube.com") || activity.link?.includes("youtu.be");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isTifl) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons/${activity.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  if (existingSubmission) {
    return (
      <div className="mt-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
        <p className="font-medium">You have already submitted this lesson.</p>
        <p>Status: {existingSubmission.status} · Points: {existingSubmission.points_awarded}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {activity.link && (
        <div>
          <h2 className="font-semibold mb-2">Watch / Read</h2>
          {isYouTube ? (
            <div className="aspect-video w-full max-w-2xl">
              <iframe
                className="w-full h-full rounded-lg"
                src={activity.link.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                title={activity.title}
                allowFullScreen
              />
            </div>
          ) : (
            <a href={activity.link} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
              Open link: {activity.link}
            </a>
          )}
        </div>
      )}
      {isTifl && questions.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="font-semibold">Questions</h2>
          {questions.map((q) => (
            <div key={q.id} className="space-y-2">
              <label className="block font-medium">{q.question_text}</label>
              {q.question_type === "short_quiz" && q.options?.options?.length ? (
                <select
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
                >
                  <option value="">Select an answer</option>
                  {q.options.options.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <textarea
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
                />
              )}
            </div>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors">
            {loading ? "Submitting…" : "Submit answers"}
          </button>
        </form>
      )}
    </div>
  );
}
