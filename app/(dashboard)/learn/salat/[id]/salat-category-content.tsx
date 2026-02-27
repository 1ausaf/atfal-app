"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "not_started" | "ready_for_test" | "passed" | "failed";

export function SalatCategoryContent({
  categoryId,
  status,
  requestedAt,
}: {
  categoryId: string;
  status: Status;
  requestedAt: string | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestTest() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/salat/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestAgain() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/salat/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const buttonClass =
    "px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-xl shadow-card hover:bg-emerald-700 hover:shadow-card-hover disabled:opacity-50 transition-all duration-200";

  if (status === "passed") {
    return (
      <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex items-center gap-3">
        <span className="text-emerald-600 dark:text-emerald-400 text-lg" aria-hidden>✓</span>
        <span className="font-medium text-emerald-800 dark:text-emerald-200">Passed</span>
      </div>
    );
  }

  if (status === "ready_for_test") {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-600 dark:text-amber-400 shrink-0 text-lg" aria-hidden>✓</span>
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Pending test</p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Your Local Nazim Atfal will test you on a video call or in person. You will be notified when this is confirmed.
            </p>
            {requestedAt && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Requested: {new Date(requestedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 dark:border-emerald-800/50 bg-[var(--salat-card)] dark:bg-[var(--salat-card)] p-4 shadow-card">
          <p className="text-slate-600 dark:text-slate-400">You can request to be tested again when you are ready.</p>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="button" onClick={handleRequestAgain} disabled={loading} className={buttonClass}>
          {loading ? "Requesting…" : "Request test again"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="button" onClick={handleRequestTest} disabled={loading} className={buttonClass}>
        {loading ? "Submitting…" : "I have successfully memorized and I am ready to be tested"}
      </button>
    </div>
  );
}
