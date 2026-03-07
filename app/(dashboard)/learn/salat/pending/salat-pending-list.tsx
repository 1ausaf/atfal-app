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
    return <p className="text-gta-textSecondary">No pending test requests.</p>;
  }

  return (
    <div className="card-kid overflow-hidden p-0">
      <ul className="divide-y divide-gta-border">
        {list.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-bold text-gta-text">{item.userName}</p>
              <p className="text-sm text-gta-textSecondary">@{item.userMemberCode ?? "—"}</p>
              <p className="text-sm text-gta-textSecondary">
                {item.categoryTitle} · Requested {formatDateInToronto(item.requestedAt)}
              </p>
              {item.passedArabic && (
                <p className="text-xs text-gta-primary font-semibold mt-1">Arabic Only: Passed</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {!item.passedArabic && (
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-semibold text-gta-textSecondary">Arabic Only:</span>
                  <button
                    type="button"
                    onClick={() => handleMark(item.id, { passed_arabic: true })}
                    disabled={loadingKey !== null}
                    className="px-3 py-1.5 btn-kid-primary text-sm rounded-gta-sm disabled:opacity-50"
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMark(item.id, { passed_arabic: false })}
                    disabled={loadingKey !== null}
                    className="px-3 py-1.5 bg-gta-textSecondary text-white text-sm font-semibold rounded-gta-sm hover:opacity-90 disabled:opacity-50"
                  >
                    Fail
                  </button>
                </div>
              )}
              {item.passedArabic && !item.passedTranslation && (
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-semibold text-gta-textSecondary">Arabic with Translation:</span>
                  <button
                    type="button"
                    onClick={() => handleMark(item.id, { passed_translation: true })}
                    disabled={loadingKey !== null}
                    className="px-3 py-1.5 bg-gta-secondary text-white text-sm font-semibold rounded-gta-sm hover:opacity-90 disabled:opacity-50"
                  >
                    Pass
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMark(item.id, { passed_translation: false })}
                    disabled={loadingKey !== null}
                    className="px-3 py-1.5 bg-gta-textSecondary text-white text-sm font-semibold rounded-gta-sm hover:opacity-90 disabled:opacity-50"
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
