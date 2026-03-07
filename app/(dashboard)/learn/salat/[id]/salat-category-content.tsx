"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateInToronto } from "@/lib/datetime";

type Status = "not_started" | "ready_for_test" | "passed" | "failed";

export function SalatCategoryContent({
  categoryId,
  status,
  requestedAt,
  passedArabic,
  passedTranslation,
}: {
  categoryId: string;
  status: Status;
  requestedAt: string | null;
  passedArabic?: boolean;
  passedTranslation?: boolean;
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
    "px-5 py-2.5 btn-kid-primary rounded-gta disabled:opacity-50 transition-all duration-200";

  if (status === "passed" || passedArabic) {
    return (
      <div className="rounded-gta border-2 border-gta-primary bg-gta-surfaceSecondary p-4 flex flex-wrap items-center gap-3">
        <span className="text-gta-primary text-lg" aria-hidden>✓</span>
        <span className="font-bold text-gta-text">
          {passedTranslation ? "Passed (Arabic + Translation)" : "Passed (Arabic only)"}
        </span>
      </div>
    );
  }

  if (status === "ready_for_test") {
    return (
      <div className="rounded-gta border-2 border-gta-secondary bg-gta-surfaceSecondary p-4">
        <div className="flex items-start gap-3">
          <span className="text-gta-secondary shrink-0 text-lg" aria-hidden>✓</span>
          <div>
            <p className="font-bold text-gta-text">Pending test</p>
            <p className="text-sm text-gta-textSecondary mt-1">
              Regional Nazim Atfal will test you (Arabic only and/or with translation) on a video call or in person.
            </p>
            {requestedAt && (
              <p className="text-xs text-gta-textSecondary mt-2">
                Requested: {formatDateInToronto(requestedAt)}
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
        <div className="card-kid p-4">
          <p className="text-gta-textSecondary">You can request to be tested again when you are ready.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="button" onClick={handleRequestAgain} disabled={loading} className={buttonClass}>
          {loading ? "Requesting…" : "Request test again"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={handleRequestTest} disabled={loading} className={buttonClass}>
        {loading ? "Submitting…" : "I have successfully memorized and I am ready to be tested"}
      </button>
    </div>
  );
}
