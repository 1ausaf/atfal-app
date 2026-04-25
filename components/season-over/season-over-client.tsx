"use client";

import { useEffect, useMemo, useState } from "react";
import type { FrozenMajlisData } from "@/lib/season-over-majlis";

const TORONTO_TZ = "America/Toronto";

type Props = {
  season3StartIso: string;
  displayName: string;
  lessonsCompleted: number;
  homeworkApprovedCount: number;
  seasonPoints: number;
  allTimePoints: number;
  ageGroupLabel: string | null;
  ageGroupRank: number | null;
  majlis: FrozenMajlisData | null;
  highlightMajlisId: string | null;
};

function formatSeason3StartLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-CA", {
    timeZone: TORONTO_TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function SeasonOverClient({
  season3StartIso,
  displayName,
  lessonsCompleted,
  homeworkApprovedCount,
  seasonPoints,
  allTimePoints,
  ageGroupLabel,
  ageGroupRank,
  majlis,
  highlightMajlisId,
}: Props) {
  const targetMs = useMemo(() => new Date(season3StartIso).getTime(), [season3StartIso]);
  const [remainSec, setRemainSec] = useState(0);

  const stars = useMemo(
    () =>
      Array.from({ length: 56 }, (_, i) => ({
        key: i,
        left: `${((i * 47) % 100) + (i % 3) * 0.3}%`,
        top: `${((i * 61) % 100) + ((i * 13) % 5) * 0.2}%`,
        delay: `${(i % 11) * 0.41}s`,
        dur: `${4 + (i % 5)}s`,
        size: 1.5 + (i % 4) * 0.6,
      })),
    []
  );

  useEffect(() => {
    let id: number | undefined;
    const tick = () => {
      const ms = targetMs - Date.now();
      if (ms <= 0) {
        setRemainSec(0);
        if (id !== undefined) window.clearInterval(id);
        window.location.assign("/dashboard");
        return;
      }
      setRemainSec(Math.floor(ms / 1000));
    };
    tick();
    id = window.setInterval(tick, 1000);
    return () => {
      if (id !== undefined) window.clearInterval(id);
    };
  }, [targetMs]);

  const days = Math.floor(remainSec / 86400);
  const hours = Math.floor((remainSec % 86400) / 3600);
  const minutes = Math.floor((remainSec % 3600) / 60);
  const seconds = remainSec % 60;

  const mayarLabel =
    ageGroupLabel === "7-9"
      ? "Mayar e Sagheer (7–9)"
      : ageGroupLabel === "10-11"
        ? "Mayar e Sagheer (10–11)"
        : ageGroupLabel === "12-14"
          ? "Mayar e Kabeer (12–14)"
          : ageGroupLabel ?? "Your age group";

  return (
    <div className="relative min-h-dvh min-h-screen overflow-hidden">
      <div className="season-over-orb season-over-orb-a" aria-hidden />
      <div className="season-over-orb season-over-orb-b" aria-hidden />
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {stars.map((s) => (
          <span
            key={s.key}
            className="season-over-star"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
              animationDuration: s.dur,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10 md:py-14 flex flex-col gap-8">
        <header className="text-center space-y-3">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300/90 font-semibold">Season 2</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg">SEASON OVER</h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto">
            Hey <span className="text-emerald-300 font-semibold">{displayName}</span> — here&apos;s your recap. The app
            unlocks when Season 3 begins.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 md:p-6 shadow-2xl">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Your recap</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Lessons done" value={lessonsCompleted} sub="graded activities" />
            <Stat label="Season points" value={seasonPoints} sub="Season 2 total" />
            <Stat label="All-time pts" value={allTimePoints} sub="Season 1 + 2" />
            <Stat label="Homework" value={homeworkApprovedCount} sub="approved" />
          </div>
        </section>

        <section className="rounded-2xl border border-amber-500/25 bg-amber-950/20 backdrop-blur-md p-4 md:p-5 flex gap-3 items-start">
          <span className="text-2xl shrink-0" aria-hidden>
            🔒
          </span>
          <div>
            <h2 className="font-bold text-amber-100">Tifl leaderboard — locked</h2>
            <p className="text-sm text-amber-100/80 mt-1">
              Rankings for your Mayar are frozen until Season 3.{" "}
              <strong className="text-white">{mayarLabel}</strong>
              {ageGroupRank != null ? (
                <>
                  : you finished at <strong className="text-white">#{ageGroupRank}</strong> with{" "}
                  <strong className="text-white">{seasonPoints}</strong> season points.
                </>
              ) : (
                <>
                  {" "}
                  — <strong className="text-white">{seasonPoints}</strong> season points.
                </>
              )}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-5 md:p-6">
          <h2 className="text-xl font-bold text-white mb-1">Majlis leaderboard — final</h2>
          <p className="text-sm text-slate-400 mb-4">
            Prize: <span className="text-amber-300 font-semibold">{majlis?.prize ?? "—"}</span>
            {majlis?.goalPoints != null ? (
              <span className="text-slate-500"> · Goal: {Math.round(majlis.goalPoints)} normalized pts</span>
            ) : null}
          </p>
          {!majlis?.rows?.length ? (
            <p className="text-slate-400 text-sm">Final standings aren&apos;t available yet.</p>
          ) : (
            <div className="space-y-3 max-h-[min(52vh,420px)] overflow-y-auto pr-1">
              {majlis.rows.map((row, idx) => {
                const pct = Math.max(0, Math.min(100, Number(row.progress_pct || 0)));
                const isMine = !!highlightMajlisId && row.majlis_id === highlightMajlisId;
                return (
                  <div
                    key={row.majlis_id}
                    className={`majlis-thermo-card border-white/10 !bg-slate-900/50 ${isMine ? "majlis-thermo-card-active" : ""}`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <p className="font-semibold text-slate-100">
                        #{idx + 1} {row.majlis_name}
                      </p>
                      <p className="text-sm font-bold text-emerald-300">{Number(row.normalized_points || 0).toFixed(2)}</p>
                    </div>
                    <div className="majlis-thermo-track mt-2 bg-slate-700/60">
                      <div className="majlis-thermo-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{pct.toFixed(1)}% toward goal</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 backdrop-blur-md p-5 md:p-6 text-center space-y-3">
          <h2 className="text-lg font-bold text-emerald-100">Season 3 countdown</h2>
          <p className="text-sm text-emerald-100/75">{formatSeason3StartLabel(season3StartIso)}</p>
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 font-mono text-2xl md:text-3xl font-bold text-white tabular-nums">
            <CountBox label="Days" value={days} />
            <CountBox label="Hrs" value={pad2(hours)} />
            <CountBox label="Min" value={pad2(minutes)} />
            <CountBox label="Sec" value={pad2(seconds)} />
          </div>
        </section>

        <p className="text-center text-xs text-slate-500 pb-6">
          The rest of the app opens automatically at Season 3 start — stay on this page or refresh after the countdown
          ends.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded-xl bg-black/25 border border-white/10 px-3 py-3 text-center">
      <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
    </div>
  );
}

function CountBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-black/30 border border-white/10 px-4 py-3 min-w-[4.5rem]">
      <p className="text-[10px] uppercase text-emerald-200/70 font-semibold">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
