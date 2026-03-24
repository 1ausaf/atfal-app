"use client";

import { useEffect, useMemo, useState } from "react";
import { computeCoefficientFromCounts } from "@/lib/majlis-competition";

type Season = {
  id: string;
  name: string;
  goal_points: number;
  prize: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

type Majlis = { id: string; name: string };
type Coeff = { majlis_id: string; member_count_snapshot: number; coefficient: number };

export function MajlisCompetitionAdminClient() {
  const [season, setSeason] = useState<Season | null>(null);
  const [majlis, setMajlis] = useState<Majlis[]>([]);
  const [coeffs, setCoeffs] = useState<Coeff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const [name, setName] = useState("Majlis Competition Season");
  const [goalPoints, setGoalPoints] = useState("25000");
  const [prize, setPrize] = useState("Majlis Pizza Party");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [memberCounts, setMemberCounts] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/majlis-competition/config");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load competition config");
        setSeason(data.season);
        setMajlis(data.majlis ?? []);
        setCoeffs(data.coefficients ?? []);
        if (data.season) {
          setName(data.season.name ?? "Majlis Competition Season");
          setGoalPoints(String(data.season.goal_points ?? 25000));
          setPrize(data.season.prize ?? "Majlis Pizza Party");
          setStartsAt(data.season.starts_at ? new Date(data.season.starts_at).toISOString().slice(0, 16) : "");
          setEndsAt(data.season.ends_at ? new Date(data.season.ends_at).toISOString().slice(0, 16) : "");
        }
        const nextCounts: Record<string, string> = {};
        for (const m of data.majlis ?? []) {
          const row = (data.coefficients ?? []).find((c: Coeff) => c.majlis_id === m.id);
          nextCounts[m.id] = String(row?.member_count_snapshot ?? "");
        }
        setMemberCounts(nextCounts);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const averageCount = useMemo(() => {
    const values = Object.values(memberCounts).map((v) => Number(v || 0)).filter((n) => n > 0);
    if (!values.length) return 0;
    return values.reduce((sum, n) => sum + n, 0) / values.length;
  }, [memberCounts]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOkMessage(null);
    try {
      const payload = {
        name: name.trim(),
        goal_points: Number(goalPoints),
        prize: prize.trim() || "Majlis Pizza Party",
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        is_active: true,
        member_counts: Object.fromEntries(
          Object.entries(memberCounts).map(([majlisId, count]) => [majlisId, Math.max(0, Number(count || 0))])
        ),
      };
      const res = await fetch("/api/majlis-competition/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setOkMessage("Competition season saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gta-textSecondary">Loading competition settings...</p>;

  return (
    <div className="space-y-5">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {okMessage && <p className="text-emerald-600 text-sm">{okMessage}</p>}

      {season && (
        <div className="card-kid p-4">
          <h2 className="font-bold text-gta-text">Current Active Season</h2>
          <p className="text-sm text-gta-textSecondary mt-1">
            {season.name} · Goal {season.goal_points} · Prize: {season.prize}
          </p>
        </div>
      )}

      <form onSubmit={handleSave} className="card-kid p-4 space-y-4">
        <h2 className="font-bold text-gta-text">Create / Replace Active Season</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gta-textSecondary">Season name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="px-3 py-2 rounded-gta-sm border border-gta-border bg-gta-surface text-gta-text" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gta-textSecondary">Goal points</span>
            <input type="number" min={1} value={goalPoints} onChange={(e) => setGoalPoints(e.target.value)} className="px-3 py-2 rounded-gta-sm border border-gta-border bg-gta-surface text-gta-text" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gta-textSecondary">Prize</span>
            <input value={prize} onChange={(e) => setPrize(e.target.value)} className="px-3 py-2 rounded-gta-sm border border-gta-border bg-gta-surface text-gta-text" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gta-textSecondary">Starts at</span>
            <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="px-3 py-2 rounded-gta-sm border border-gta-border bg-gta-surface text-gta-text" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-gta-textSecondary">Ends at</span>
            <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="px-3 py-2 rounded-gta-sm border border-gta-border bg-gta-surface text-gta-text" />
          </label>
        </div>

        <div>
          <h3 className="font-semibold text-gta-text mb-2">Member counts and coefficients</h3>
          <div className="space-y-2">
            {majlis.map((m) => {
              const count = Number(memberCounts[m.id] || 0);
              const coeff = computeCoefficientFromCounts(count, averageCount);
              return (
                <div key={m.id} className="grid grid-cols-[1fr_120px_120px] gap-2 items-center">
                  <span className="text-sm text-gta-text">{m.name}</span>
                  <input
                    type="number"
                    min={0}
                    value={memberCounts[m.id] ?? ""}
                    onChange={(e) => setMemberCounts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    className="px-2 py-1 rounded-gta-sm border border-gta-border bg-gta-surface text-gta-text"
                  />
                  <span className="text-sm text-gta-textSecondary font-semibold">{coeff.toFixed(4)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <button disabled={saving} className="btn-kid-primary px-4 py-2 rounded-gta disabled:opacity-60">
          {saving ? "Saving..." : "Save active season"}
        </button>
      </form>

      {!!coeffs.length && (
        <div className="card-kid p-4">
          <h2 className="font-bold text-gta-text mb-2">Existing coefficients</h2>
          <ul className="space-y-1 text-sm text-gta-textSecondary">
            {coeffs.map((row) => {
              const m = majlis.find((item) => item.id === row.majlis_id);
              return (
                <li key={row.majlis_id}>
                  {m?.name ?? row.majlis_id}: {row.member_count_snapshot} members → coeff {Number(row.coefficient).toFixed(4)}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
