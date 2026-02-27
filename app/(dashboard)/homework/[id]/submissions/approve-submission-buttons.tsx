"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApproveSubmissionButtons({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [points, setPoints] = useState(10);
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/homework/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", points_awarded: points }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    try {
      const res = await fetch(`/api/homework/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={points}
        onChange={(e) => setPoints(parseInt(e.target.value, 10) || 0)}
        className="w-16 px-2 py-1 border rounded text-sm"
      />
      <button
        type="button"
        onClick={handleApprove}
        disabled={loading}
        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={handleReject}
        disabled={loading}
        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
