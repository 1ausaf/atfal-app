"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HomeworkData {
  id: string;
  majlis_id: string | null;
  title: string;
  description: string | null;
  due_by: string;
  links: string[];
}

type Scope = "region" | "majlis";

interface EditHomeworkFormProps {
  homework: HomeworkData;
  majlisList: { id: string; name: string }[];
  isRegional: boolean;
  defaultMajlisId: string | null;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

export function EditHomeworkForm({ homework, majlisList, isRegional, defaultMajlisId }: EditHomeworkFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(homework.title);
  const [description, setDescription] = useState(homework.description ?? "");
  const [dueBy, setDueBy] = useState(toDatetimeLocal(homework.due_by));
  const [linksText, setLinksText] = useState((homework.links ?? []).join("\n"));
  const [scope, setScope] = useState<Scope>(homework.majlis_id == null ? "region" : "majlis");
  const [majlisId, setMajlisId] = useState(homework.majlis_id ?? defaultMajlisId ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const links = linksText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const payloadMajlisId = isRegional ? (scope === "region" ? null : majlisId || null) : undefined;
    try {
      const res = await fetch(`/api/homework/${homework.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          due_by: dueBy,
          links,
          ...(payloadMajlisId !== undefined && { majlis_id: payloadMajlisId }),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to update");
        setLoading(false);
        return;
      }
      router.push(`/homework/${homework.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Due by</label>
        <input
          type="datetime-local"
          value={dueBy}
          onChange={(e) => setDueBy(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Links (one per line or comma-separated)</label>
        <textarea
          value={linksText}
          onChange={(e) => setLinksText(e.target.value)}
          placeholder="https://..."
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        />
      </div>
      {isRegional && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Who can see this homework?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "region"}
                  onChange={() => setScope("region")}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Post for entire region (all users)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === "majlis"}
                  onChange={() => setScope("majlis")}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Post for a specific Majlis</span>
              </label>
            </div>
          </div>
          {scope === "majlis" && (
            <div>
              <label className="block text-sm font-medium mb-1">Majlis</label>
              <select
                value={majlisId}
                onChange={(e) => setMajlisId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
              >
                <option value="">Select Majlis</option>
                {majlisList.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors">
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
