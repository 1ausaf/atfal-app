"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  title: string | null;
  body: string;
  created_at: string;
};

export function TiflAnnouncementsAdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/tifl-announcements");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOkMessage(null);
    try {
      const res = await fetch("/api/admin/tifl-announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          body: body.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to publish");
      setOkMessage("Announcement published. Tifls who have not dismissed it yet will see it.");
      setBody("");
      setTitle("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-gta border border-gta-border bg-gta-surface p-5 shadow-gta">
        <h2 className="text-lg font-bold text-gta-text mb-3">Publish a new announcement</h2>
        <p className="text-sm text-gta-textSecondary mb-4">
          This becomes the latest announcement. Each tifl sees it until they close it; a later announcement shows again to everyone who has not dismissed that new one.
        </p>
        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label htmlFor="ann-title" className="block text-sm font-medium text-gta-text mb-1">
              Title (optional)
            </label>
            <input
              id="ann-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-gta border border-gta-border bg-gta-surfaceSecondary px-3 py-2 text-gta-text"
              maxLength={200}
              placeholder="Short heading"
            />
          </div>
          <div>
            <label htmlFor="ann-body" className="block text-sm font-medium text-gta-text mb-1">
              Message
            </label>
            <textarea
              id="ann-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={8}
              className="w-full rounded-gta border border-gta-border bg-gta-surfaceSecondary px-3 py-2 text-gta-text font-sans"
              placeholder="Announcement text…"
            />
          </div>
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          {okMessage ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{okMessage}</p> : null}
          <button
            type="submit"
            disabled={saving || !body.trim()}
            className="px-4 py-2 rounded-gta btn-kid-primary font-semibold disabled:opacity-50"
          >
            {saving ? "Publishing…" : "Publish announcement"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-bold text-gta-text mb-3">Recent announcements</h2>
        {loading ? (
          <p className="text-gta-textSecondary">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-gta-textSecondary">None yet.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-gta border border-gta-border bg-gta-surface p-4 shadow-gta text-sm"
              >
                <div className="flex flex-wrap justify-between gap-2 text-gta-textSecondary mb-2">
                  <span>{new Date(r.created_at).toLocaleString()}</span>
                  <span className="font-mono text-xs">{r.id.slice(0, 8)}…</span>
                </div>
                {r.title ? <p className="font-bold text-gta-text mb-1">{r.title}</p> : null}
                <p className="text-gta-text whitespace-pre-wrap">{r.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
