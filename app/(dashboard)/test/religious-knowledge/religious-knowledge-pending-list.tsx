"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateInToronto } from "@/lib/datetime";

type Item = {
  id: string;
  userName: string;
  userMemberCode: string;
  sectionTitle: string;
  requestedAt: string;
  status: "ready_for_test" | "failed";
};

export function ReligiousKnowledgePendingList({ list }: { list: Item[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function mark(id: string, status: "passed" | "failed") {
    setLoadingId(`${id}-${status}`);
    try {
      const res = await fetch(`/api/religious-knowledge/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (!list.length) return <p className="text-gta-textSecondary">No pending Religious Knowledge test requests.</p>;

  return (
    <div className="card-kid overflow-hidden p-0">
      <ul className="divide-y divide-gta-border">
        {list.map((item) => (
          <li key={item.id} className="px-4 py-3 flex flex-wrap justify-between gap-3 items-center">
            <div>
              <p className="font-bold text-gta-text">{item.userName}</p>
              <p className="text-sm text-gta-textSecondary">@{item.userMemberCode}</p>
              <p className="text-sm text-gta-textSecondary">
                {item.sectionTitle} · Requested {formatDateInToronto(item.requestedAt)}
              </p>
              {item.status === "failed" && (
                <p className="text-xs font-semibold text-gta-secondary mt-1">Previously failed. Retry requested.</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={loadingId !== null}
                onClick={() => mark(item.id, "passed")}
                className="px-3 py-1.5 btn-kid-primary rounded-gta-sm text-sm disabled:opacity-50"
              >
                Pass
              </button>
              <button
                type="button"
                disabled={loadingId !== null}
                onClick={() => mark(item.id, "failed")}
                className="px-3 py-1.5 bg-gta-textSecondary text-white rounded-gta-sm text-sm disabled:opacity-50"
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
