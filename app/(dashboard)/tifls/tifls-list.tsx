"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TiflRow {
  id: string;
  name: string | null;
  age: number | null;
  age_group: string | null;
  majlis_id: string | null;
  date_of_birth: string | null;
  created_at: string;
}

interface TiflsListProps {
  initialTifls: TiflRow[];
  majlisList: { id: string; name: string }[];
  isRegional: boolean;
  majlisMap: Map<string, string>;
}

export function TiflsList({ initialTifls, majlisList, isRegional, majlisMap }: TiflsListProps) {
  const router = useRouter();
  const [tifls, setTifls] = useState(initialTifls);
  const [filterMajlis, setFilterMajlis] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDob, setEditDob] = useState("");

  useEffect(() => {
    if (!isRegional || !filterMajlis) {
      setTifls(initialTifls);
      return;
    }
    fetch(`/api/tifls?majlis_id=${filterMajlis}`)
      .then((r) => r.json())
      .then((data) => setTifls(Array.isArray(data) ? data : []))
      .catch(() => setTifls([]));
  }, [isRegional, filterMajlis, initialTifls]);

  async function handleMove(tiflId: string, newMajlisId: string) {
    if (!newMajlisId) return;
    const res = await fetch(`/api/tifls/${tiflId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ majlis_id: newMajlisId }),
    });
    if (res.ok) router.refresh();
  }

  async function handleDelete(tiflId: string) {
    if (!confirm("Soft-delete this Tifl? They will not be able to log in.")) return;
    const res = await fetch(`/api/tifls/${tiflId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deleted: true }),
    });
    if (res.ok) router.refresh();
  }

  function startEdit(t: TiflRow) {
    setEditingId(t.id);
    setEditName(t.name ?? "");
    setEditDob(t.date_of_birth ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(tiflId: string) {
    const res = await fetch(`/api/tifls/${tiflId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() || null, date_of_birth: editDob || null }),
    });
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    } else {
      const d = await res.json();
      alert(d.error ?? "Failed to update");
    }
  }

  return (
    <div className="space-y-4">
      {isRegional && (
        <div>
          <label className="block text-sm font-medium mb-1">Filter by Majlis</label>
          <select
            value={filterMajlis}
            onChange={(e) => setFilterMajlis(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="">All</option>
            {majlisList.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}
      {!tifls.length ? (
        <p className="text-slate-500 dark:text-slate-400">No Tifls found.</p>
      ) : (
        <ul className="space-y-3">
          {tifls.map((t) => (
            <li key={t.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card p-4 flex justify-between items-center flex-wrap gap-2">
              {editingId === t.id ? (
                <div className="flex-1 space-y-2 min-w-0">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Date of birth</label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={(e) => setEditDob(e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => saveEdit(t.id)} className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700">
                      Save
                    </button>
                    <button type="button" onClick={cancelEdit} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <span className="font-medium">{t.name ?? "—"}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">Age {t.age ?? "—"} · {t.age_group ?? "—"}</span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400">{t.majlis_id ? majlisMap.get(t.majlis_id) : "—"}</span>
                  </div>
                  {isRegional ? (
                    <div className="flex items-center gap-2">
                      <select
                        defaultValue={t.majlis_id ?? ""}
                        onChange={(e) => handleMove(t.id, e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="">Move to…</option>
                        {majlisList.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleDelete(t.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(t)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500"
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
