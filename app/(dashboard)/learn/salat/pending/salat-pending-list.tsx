"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { id: string; userName: string; categoryTitle: string; requestedAt: string };

export function SalatPendingList({ list }: { list: Item[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleResult(id: string, status: "passed" | "failed") {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/salat/progress/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (!list.length) {
    return <p className="text-slate-500 dark:text-slate-400">No pending test requests.</p>;
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card overflow-hidden">
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {list.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">{item.userName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {item.categoryTitle} · Requested {new Date(item.requestedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleResult(item.id, "passed")}
                disabled={loadingId === item.id}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Pass
              </button>
              <button
                type="button"
                onClick={() => handleResult(item.id, "failed")}
                disabled={loadingId === item.id}
                className="px-3 py-1.5 bg-slate-500 text-white text-sm font-medium rounded-lg hover:bg-slate-600 disabled:opacity-50"
              >
                Fail
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
