"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MY_RELIGIOUS_KNOWLEDGE_CHECKPOINTS } from "@/lib/my-religious-knowledge";

type RequestStatus = "not_started" | "ready_for_test" | "passed" | "failed";
type RequestMap = Record<string, { status: RequestStatus; requested_at?: string | null }>;

export function MyReligiousKnowledgeMap() {
  const [statusMap, setStatusMap] = useState<RequestMap>({});
  const [loading, setLoading] = useState(true);

  const checkpoints = MY_RELIGIOUS_KNOWLEDGE_CHECKPOINTS;

  useEffect(() => {
    async function loadRequests() {
      setLoading(true);
      try {
        const res = await fetch("/api/religious-knowledge/requests");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load section status");
        const next: RequestMap = {};
        for (const row of data as Array<{ section_id: string; status: RequestStatus; requested_at?: string | null }>) {
          next[row.section_id] = { status: row.status, requested_at: row.requested_at ?? null };
        }
        setStatusMap(next);
      } catch (e) {
        // keep UI usable even if status fetch fails
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, []);

  const unlockedCheckpointOrder = useMemo<number>(() => {
    let unlocked = 1;
    for (let i = 0; i < checkpoints.length; i += 1) {
      const cp = checkpoints[i];
      const status = statusMap[cp.id]?.status ?? "not_started";
      if (status === "passed") {
        unlocked = i + 2;
      } else {
        break;
      }
    }
    return Math.min(unlocked, checkpoints.length);
  }, [checkpoints, statusMap]);

  return (
    <div className="relative rk-page-shell">
      <div className="rk-hero mb-5">
        <p className="rk-hero-kicker">Adventure Track</p>
        <h1 className="text-3xl font-extrabold text-gta-text">My Religious Knowledge</h1>
        <p className="text-gta-textSecondary mt-2 max-w-3xl">
          Pick a pentagon, revise that section, and tap <strong>Ready to be tested</strong> when you feel confident.
          Pass a section to unlock the next one.
        </p>
        <div className="rk-hero-chips mt-3">
          <span className="rk-chip rk-chip-open">Open Section</span>
          <span className="rk-chip rk-chip-pending">Pending Test</span>
          <span className="rk-chip rk-chip-passed">Passed</span>
        </div>
      </div>

      <div className="rk-grid-wrap">
        {loading ? (
          <p className="text-gta-textSecondary">Loading your learning path...</p>
        ) : (
          <div className="rk-grid">
            {checkpoints.map((checkpoint) => {
              const isUnlocked = checkpoint.order <= unlockedCheckpointOrder;
              const status = statusMap[checkpoint.id]?.status ?? "not_started";
              const isCompleted = status === "passed";
              return isUnlocked ? (
                <Link
                  key={checkpoint.id}
                  href={`/learn/courses/my-religious-knowledge/${checkpoint.id}`}
                  className={`rk-grid-pentagon ${
                    isUnlocked ? "rk-grid-pentagon-unlocked" : "rk-grid-pentagon-locked"
                  } ${isCompleted ? "rk-grid-pentagon-completed" : ""}`}
                >
                  <span className="rk-grid-pentagon-order">{checkpoint.order}</span>
                  <span className="rk-grid-pentagon-title">{checkpoint.title}</span>
                  <span className="rk-grid-pentagon-status">
                    {status === "passed" && "PASSED"}
                    {status === "ready_for_test" && "PENDING TEST"}
                    {status === "failed" && "RETRY"}
                    {status === "not_started" && (isUnlocked ? "OPEN" : "LOCKED")}
                  </span>
                </Link>
              ) : (
                <button
                  key={checkpoint.id}
                  type="button"
                  disabled
                  className="rk-grid-pentagon rk-grid-pentagon-locked"
                >
                  <span className="rk-grid-pentagon-order">{checkpoint.order}</span>
                  <span className="rk-grid-pentagon-title">{checkpoint.title}</span>
                  <span className="rk-grid-pentagon-status">LOCKED</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
