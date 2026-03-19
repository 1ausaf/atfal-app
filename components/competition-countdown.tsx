"use client";

import { useEffect, useMemo, useState } from "react";
import { getTodayToronto, parseDateTimeLocalAsToronto } from "@/lib/datetime";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function CompetitionCountdown() {
  // NOTE: This is a NEXT_PUBLIC var so it is inlined at build time for the client.
  const endLocal = process.env.NEXT_PUBLIC_COMPETITION_END_TORONTO_LOCAL as string | undefined;

  const endDate = useMemo(() => {
    if (!endLocal || typeof endLocal !== "string") return null;
    try {
      // Env is expected to be a datetime-local string in Toronto time (YYYY-MM-DDTHH:mm).
      const iso = parseDateTimeLocalAsToronto(endLocal);
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      return d;
    } catch {
      return null;
    }
  }, [endLocal]);

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!endDate) {
    return (
      <section className="card-kid p-6 md:p-7">
        <h2 className="text-lg font-bold text-gta-text tracking-tight">Winner countdown unavailable</h2>
        <p className="text-sm text-gta-textSecondary mt-1">
          Set `NEXT_PUBLIC_COMPETITION_END_TORONTO_LOCAL` to enable the timer.
        </p>
      </section>
    );
  }

  const diffMs = endDate.getTime() - nowMs;
  if (diffMs <= 0) {
    return (
      <section className="card-kid p-6 md:p-7 border border-amber-400/25 shadow-[0_0_28px_rgba(251,191,36,0.18)]">
        <h2 className="text-3xl md:text-4xl font-extrabold text-amber-500 dark:text-amber-400 animate-points-glow tracking-tight">
          Winner is decided
        </h2>
      </section>
    );
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Very specific required copy:
  // "_ Hours _ Minutes _ Seconds left!"
  const countdownText = `${hours} Hours ${pad2(minutes)} Minutes ${pad2(seconds)} Seconds left!`;

  // getTodayToronto is kept referenced to ensure timezone helper stays in bundle and for potential future reuse.
  // (Unused but safe for tree-shaking due to useMemo above; this is only for bundler stability.)
  getTodayToronto();

  return (
    <section className="card-kid p-6 md:p-7 border border-amber-400/25 shadow-[0_0_28px_rgba(251,191,36,0.18)]">
      <h2
        className="text-3xl md:text-4xl font-extrabold text-amber-500 dark:text-amber-400 animate-points-glow tracking-tight text-center"
        aria-live="polite"
      >
        {countdownText}
      </h2>
      <p className="mt-2 text-xs md:text-sm text-gta-textSecondary dark:text-slate-400 text-center">
        Until the winner of the $100 is decided! Winner will be announced on whatsapp.
      </p>
    </section>
  );
}

