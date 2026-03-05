"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateInToronto } from "@/lib/datetime";

type Item = {
  id: string;
  userName: string;
  userMemberCode?: string;
  categoryTitle: string;
  requestedAt: string;
  passedArabic: boolean;
  passedTranslation: boolean;
};

export function SalatPendingList({ list }: { list: Item[] }) {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function handleMark(id: string, payload: { passed_arabic?: boolean; passed_translation?: boolean }) {
    const key = `${id}-${JSON.stringify(payload)}`;
    setLoadingKey(key);
    try {
      const res = await fetch(`/api/salat/progress/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setLoadingKey(null);
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
              <p className="text-sm text-slate-500 dark:text-slate-400">@{item.userMemberCode ?? "—"}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {item.categoryTitle} · Requested {formatDateInToronto(item.requestedAt)}
              </p>
              {item.passedArabic && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Arabic Only: Passed</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {!item.passedArabic && (
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Arabic Only:</span>
                  <button
                    type="button"
                    onClick={() => handleMark(item.id, { passed_arabic: true })}
                    disabled={loadingKey !== null}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMark(item.id, { passed_arabic: false })}
                    disabled={loadingKey !== null}
                    className="px-3 py-1.5 bg-slate-500 text-white text-sm font-medium rounded-lg hover:bg-slate-600 disabled:opacity-50"
                  >
                    Fail
                  </button>
                </div>
              )}
              {item.passedArabic && !item.passedTranslation && (
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Arabic with Translation:</span>
                  <button
                    type="button"
                    onClick={() => handleMark(item.id, { passed_translation: true })}
                    disabled={loadingKey !== null}
                    className="px-3 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMark(item.id, { passed_translation: false })}
                    disabled={loadingKey !== null}
                    className="px-3 py-1.5 bg-slate-500 text-white text-sm font-medium rounded-lg hover:bg-slate-600 disabled:opacity-50"
                  >
                    Fail
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
