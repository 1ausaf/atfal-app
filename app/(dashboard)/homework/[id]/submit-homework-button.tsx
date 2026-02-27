"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubmitHomeworkButton({ homeworkId }: { homeworkId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/homework/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homework_id: homeworkId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to submit");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Mark as submitted"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
