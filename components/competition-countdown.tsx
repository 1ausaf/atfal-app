"use client";

import { useEffect, useMemo, useState } from "react";
import { getTodayToronto, parseDateTimeLocalAsToronto } from "@/lib/datetime";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

type WinnerPayload = {
  id: string;
  name: string | null;
  age: number | null;
  majlis: string | null;
  points: number;
  lessonsCompletedPct: number;
  averageMarksPct: number;
};

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

export function CompetitionCountdown() {
  // NOTE: NEXT_PUBLIC_* vars are inlined at build time for the client.
  const endLocal = process.env.NEXT_PUBLIC_COMPETITION_END_TORONTO_LOCAL as string | undefined;
  const seasonHeadline =
    (process.env.NEXT_PUBLIC_SEASON_COUNTDOWN_HEADLINE as string | undefined)?.trim() || "SEASON 2 STARTING MONDAY";

  const parsedEndDate = useMemo(() => {
    if (!endLocal || typeof endLocal !== "string") return null;
    const raw = endLocal.trim();
    if (!raw) return null;

    // If Vercel wraps the value in quotes, strip them.
    const unquoted =
      (raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")) ? raw.slice(1, -1) : raw;

    const withoutSeconds = unquoted.replace(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}):\d{2}$/, "$1");

    // Strict format: YYYY-MM-DDTHH:mm (Toronto local)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(withoutSeconds)) {
      const iso = parseDateTimeLocalAsToronto(withoutSeconds);
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // Common alternative: YYYY-MM-DDTHH:mm:ss (Toronto local)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(unquoted)) {
      const hhmm = unquoted.slice(0, 16); // keep YYYY-MM-DDTHH:mm
      const iso = parseDateTimeLocalAsToronto(hhmm);
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // ISO w/ timezone offset or Z -> let Date parse it.
    // Examples: 2026-03-19T18:00:00Z, 2026-03-19T18:00:00-04:00
    const d = new Date(unquoted);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [endLocal]);

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [winner, setWinner] = useState<WinnerPayload | null>(null);
  const [winnerStatus, setWinnerStatus] = useState<"idle" | "loading" | "success" | "empty" | "error">("idle");
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!parsedEndDate) {
    return (
      <section className="card-kid p-6 md:p-7">
        <h2 className="text-lg font-bold text-gta-text tracking-tight">Season countdown unavailable</h2>
        <p className="text-sm text-gta-textSecondary mt-1">
          Set `NEXT_PUBLIC_COMPETITION_END_TORONTO_LOCAL` (e.g. 2026-03-23T15:00 for Monday Mar 23, 2026 3:00 PM Toronto).
        </p>
      </section>
    );
  }

  const diffMs = parsedEndDate.getTime() - nowMs;
  const hasEnded = diffMs <= 0;

  useEffect(() => {
    if (!hasEnded || winnerStatus !== "idle") return;

    let active = true;
    const loadWinner = async () => {
      setWinnerStatus("loading");
      try {
        const res = await fetch("/api/leaderboard/winner", { method: "GET", credentials: "include" });
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const json = (await res.json()) as { winner?: WinnerPayload | null };
        if (!active) return;
        if (!json.winner) {
          setWinner(null);
          setWinnerStatus("empty");
          return;
        }
        setWinner(json.winner);
        setWinnerStatus("success");
      } catch {
        if (!active) return;
        setWinner(null);
        setWinnerStatus("error");
      }
    };

    void loadWinner();
    return () => {
      active = false;
    };
  }, [hasEnded, winnerStatus]);

  if (diffMs <= 0) {
    if (winnerStatus === "loading" || winnerStatus === "idle") {
      return (
        <section className="card-kid p-6 md:p-7 border border-amber-400/25 shadow-[0_0_28px_rgba(251,191,36,0.18)]">
          <h2 className="text-3xl md:text-4xl font-extrabold text-amber-500 dark:text-amber-400 tracking-tight text-center">
            Season 2 has started
          </h2>
          <p className="mt-2 text-sm text-gta-textSecondary text-center">Loading…</p>
        </section>
      );
    }

    if (winnerStatus === "empty") {
      return (
        <section className="card-kid p-6 md:p-7 border border-amber-400/25 shadow-[0_0_28px_rgba(251,191,36,0.18)]">
          <h2 className="text-3xl md:text-4xl font-extrabold text-amber-500 dark:text-amber-400 tracking-tight text-center">
            Season 2 has started
          </h2>
          <p className="mt-2 text-sm text-gta-textSecondary text-center">No leaderboard winner found yet.</p>
        </section>
      );
    }

    if (winnerStatus === "error" || !winner) {
      return (
        <section className="card-kid p-6 md:p-7 border border-amber-400/25 shadow-[0_0_28px_rgba(251,191,36,0.18)]">
          <h2 className="text-3xl md:text-4xl font-extrabold text-amber-500 dark:text-amber-400 tracking-tight text-center">
            Season 2 has started
          </h2>
          <p className="mt-2 text-sm text-gta-textSecondary text-center">
            Winner details are temporarily unavailable.
          </p>
        </section>
      );
    }

    return (
      <section className="card-kid p-6 md:p-7 border border-amber-400/25 shadow-[0_0_28px_rgba(251,191,36,0.18)]">
        <h2 className="text-3xl md:text-4xl font-extrabold text-amber-500 dark:text-amber-400 animate-points-glow tracking-tight text-center">
          Season winner
        </h2>
        <div className="mt-4 rounded-gta border border-gta-border bg-gta-surfaceSecondary/60 p-4">
          <p className="text-lg font-bold text-gta-text text-center">{winner.name ?? "Unnamed Tifl"}</p>
          <p className="text-sm text-gta-textSecondary mt-1 text-center">
            Age {winner.age ?? "—"} · {winner.majlis ?? "—"}
          </p>
          <p className="text-center mt-3">
            <span className="text-2xl font-extrabold text-gta-primary">{winner.points}</span>
            <span className="ml-1 text-sm font-semibold text-gta-textSecondary">pts</span>
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="rounded-gta-sm border border-gta-border p-2">
              <p className="text-gta-textSecondary">Lessons completed</p>
              <p className="font-bold text-gta-text">{formatPercent(winner.lessonsCompletedPct)}</p>
            </div>
            <div className="rounded-gta-sm border border-gta-border p-2">
              <p className="text-gta-textSecondary">Average marks</p>
              <p className="font-bold text-gta-text">{formatPercent(winner.averageMarksPct)}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const countdownText = `${hours} Hours ${pad2(minutes)} Minutes ${pad2(seconds)} Seconds left!`;

  getTodayToronto();

  return (
    <section className="card-kid p-6 md:p-7 border border-amber-400/25 shadow-[0_0_28px_rgba(251,191,36,0.18)]">
      <h2
        className="text-2xl md:text-3xl font-extrabold text-amber-500 dark:text-amber-400 animate-points-glow tracking-tight text-center uppercase"
        aria-live="polite"
      >
        {seasonHeadline}
      </h2>
      <p
        className="mt-3 text-3xl md:text-4xl font-extrabold text-amber-500 dark:text-amber-400 tracking-tight text-center tabular-nums"
        aria-live="polite"
      >
        {countdownText}
      </p>
      <p className="mt-2 text-xs md:text-sm text-gta-textSecondary dark:text-slate-400 text-center">
        Countdown to Season 2 start (Toronto local time).
      </p>
    </section>
  );
}

