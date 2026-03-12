"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface HabitDef {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
}

export function MyLifeOnboarding({ userId }: { userId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [optionalHabits, setOptionalHabits] = useState<HabitDef[]>([]);
  const [optionalLoading, setOptionalLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customHabits, setCustomHabits] = useState<{ id: string; label: string }[]>([]);
  const [customLabel, setCustomLabel] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  const [customHabitError, setCustomHabitError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 0) return;
    setOptionalLoading(true);
    fetch("/api/my-life/habits?optional_only=true")
      .then((r) => r.json())
      .then((data) => setOptionalHabits((data.definitions ?? []).slice().sort((a: HabitDef, b: HabitDef) => (a.sort_order ?? 0) - (b.sort_order ?? 0))))
      .finally(() => setOptionalLoading(false));
  }, [step]);

  function toggleHabit(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  }

  async function addCustomHabit() {
    const label = customLabel.trim();
    if (!label || selectedIds.size >= 5) return;
    setAddingCustom(true);
    setCustomHabitError(null);
    try {
      const res = await fetch("/api/my-life/habits/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCustomHabitError(typeof data?.error === "string" ? data.error : "Couldn't add habit. Please try again.");
        return;
      }
      if (data?.id) {
        setSelectedIds((prev) => (prev.size < 5 ? new Set(prev).add(data.id) : prev));
        setCustomHabits((prev) => [...prev, { id: data.id, label: data.label ?? label }]);
        setCustomLabel("");
      }
    } finally {
      setAddingCustom(false);
    }
  }

  async function saveSelectionsAndNext() {
    if (selectedIds.size !== 5) return;
    setLoading(true);
    try {
      const res = await fetch("/api/my-life/habits/selections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habit_definition_ids: Array.from(selectedIds) }),
      });
      if (res.ok) setStep(1);
    } finally {
      setLoading(false);
    }
  }

  async function completeOnboarding() {
    setLoading(true);
    try {
      const res = await fetch("/api/my-life/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_completed_at: true }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const CORE_HABITS = [
    "Fajr Prayer",
    "Zuhr Prayer",
    "Asr Prayer",
    "Maghrib Prayer",
    "Ishaa Prayer",
    "Reading Quran",
  ];

  const steps = [
    null,
    {
      title: "Your core habits",
      body: "Every tifl tracks these six habits in My Life. They will appear in your Habits section and help you grow. You can't remove them – they're part of your journey!",
      cta: "I'm ready",
      action: () => setStep(2),
      extra: (
        <ul className="text-left list-disc list-inside text-gta-text dark:text-slate-200 space-y-1.5 mt-4 mb-6 max-w-xs mx-auto">
          {CORE_HABITS.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      ),
    },
    {
      title: "Welcome to My Life",
      body: "You'll track your habits and goals in one place.",
      cta: "Get started",
      action: () => setStep(3),
      extra: null,
    },
    {
      title: "You're all set!",
      body: "You can add goals and track habits from the dashboard. Let's go!",
      cta: "Go to My Life",
      action: completeOnboarding,
      extra: null,
    },
  ];

  if (step === 0) {
    return (
      <div className="card-kid p-6 md:p-8 max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold text-gta-text dark:text-slate-100 mb-2">
          Pick 5 habits you want to improve on
        </h2>
        <p className="text-gta-textSecondary dark:text-slate-400 text-sm mb-4">
          These will appear in your Habits section alongside your core habits. Choose exactly 5.
        </p>
        {optionalLoading ? (
          <p className="text-gta-textSecondary dark:text-slate-400">Loading…</p>
        ) : (
          <>
            <ul className="text-left space-y-2 mb-4 max-w-sm mx-auto">
              {optionalHabits.map((h) => (
                <li key={h.id}>
                  <label className="flex items-center gap-2 cursor-pointer text-gta-text dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(h.id)}
                      onChange={() => toggleHabit(h.id)}
                      className="rounded border-gta-border dark:border-slate-600"
                    />
                    {h.label}
                  </label>
                </li>
              ))}
              {customHabits.map((h) => (
                <li key={h.id} className="flex items-center gap-2 text-gta-text dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(h.id)}
                    onChange={() => toggleHabit(h.id)}
                    className="rounded border-gta-border dark:border-slate-600"
                  />
                  {h.label} <span className="text-xs text-gta-textSecondary dark:text-slate-400">(custom)</span>
                </li>
              ))}
            </ul>
            <div className="max-w-sm mx-auto mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => {
                    setCustomLabel(e.target.value);
                    if (customHabitError) setCustomHabitError(null);
                  }}
                  placeholder="Add your own habit (e.g. Exercise daily)"
                  className="flex-1 rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 px-3 py-2 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomHabit())}
                />
                <button
                  type="button"
                  onClick={addCustomHabit}
                  disabled={addingCustom || !customLabel.trim() || selectedIds.size >= 5}
                  className="btn-kid-primary px-3 py-2 rounded-gta-sm text-sm disabled:opacity-50"
                >
                  {addingCustom ? "Adding…" : "Add"}
                </button>
              </div>
              {customHabitError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-left">{customHabitError}</p>
              )}
            </div>
            <p className="text-sm text-gta-textSecondary dark:text-slate-400 mb-4">
              {selectedIds.size} of 5 selected
            </p>
            <button
              type="button"
              onClick={saveSelectionsAndNext}
              disabled={loading || selectedIds.size !== 5}
              className="btn-kid-primary px-6 py-3 rounded-gta disabled:opacity-50"
            >
              {loading ? "Saving…" : "I'm ready"}
            </button>
          </>
        )}
      </div>
    );
  }

  const current = steps[step]!;
  return (
    <div className="card-kid p-6 md:p-8 max-w-lg mx-auto text-center">
      <h2 className="text-2xl font-bold text-gta-text dark:text-slate-100 mb-4">
        {current.title}
      </h2>
      <p className="text-gta-textSecondary dark:text-slate-400">
        {current.body}
      </p>
      {current.extra}
      <button
        type="button"
        onClick={current.action}
        disabled={loading}
        className="btn-kid-primary px-6 py-3 rounded-gta"
      >
        {loading ? "Loading…" : current.cta}
      </button>
    </div>
  );
}
