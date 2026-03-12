"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getTodayToronto } from "@/lib/datetime";

type Mood = "great" | "good" | "okay" | "bad";

interface CheckIn {
  id: string;
  date: string;
  mood: Mood;
  one_good_thing: string | null;
}

export function CheckInPage() {
  const router = useRouter();
  const today = getTodayToronto();
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mood, setMood] = useState<Mood>("good");
  const [oneGoodThing, setOneGoodThing] = useState("");

  useEffect(() => {
    fetch(`/api/my-life/check-in?date=${today}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setCheckIn(data);
          setMood(data.mood);
          setOneGoodThing(data.one_good_thing ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [today]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    fetch("/api/my-life/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: today,
        mood,
        one_good_thing: oneGoodThing || null,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) setCheckIn(data);
        router.refresh();
      })
      .finally(() => setSaving(false));
  }

  if (loading) return <p className="text-gta-textSecondary dark:text-slate-400">Loading…</p>;

  return (
    <div className="card-kid p-4 max-w-lg">
      <h2 className="text-lg font-bold text-gta-text dark:text-slate-100 mb-1">
        How did you feel today?
      </h2>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["great", "good", "okay", "bad"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              className={`px-3 py-1.5 rounded-gta-sm text-sm font-medium capitalize ${
                mood === m ? "btn-kid-primary" : "bg-gta-surfaceSecondary dark:bg-slate-700 text-gta-text dark:text-slate-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-xs font-medium text-gta-textSecondary dark:text-slate-400 mb-1">
            One good thing I did today (optional)
          </label>
          <textarea
            value={oneGoodThing}
            onChange={(e) => setOneGoodThing(e.target.value)}
            placeholder="e.g. I shared my snack with my brother"
            rows={2}
            className="w-full rounded-gta-sm border border-gta-border dark:border-slate-600 bg-gta-surface dark:bg-slate-800 text-gta-text dark:text-slate-200 p-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="btn-kid-primary px-4 py-2 rounded-gta text-sm"
        >
          {saving ? "Saving…" : checkIn ? "Update" : "Save"}
        </button>
      </form>
    </div>
  );
}
