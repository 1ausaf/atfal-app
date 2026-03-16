"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Section {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  sort_order?: number | null;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function LessonSectionsManager() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/lessons/sections")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSections(data);
      })
      .catch(() => setError("Could not load sections"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleThumbnailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png") {
      setError("Only PNG images allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File too large (max 2MB)");
      return;
    }
    setError(null);
    setThumbnailUploading(true);
    try {
      const form = new FormData();
      form.set("thumbnail", file);
      const res = await fetch("/api/lessons/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Thumbnail upload failed");
        return;
      }
      setThumbnailUrl(data.url);
    } finally {
      setThumbnailUploading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/lessons/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          thumbnail_url: thumbnailUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create section");
        return;
      }
      setTitle("");
      setDescription("");
      setThumbnailUrl(null);
      load();
    } catch {
      setError("Something went wrong while creating section");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this section? Lessons will become uncategorized.")) return;
    try {
      const res = await fetch(`/api/lessons/sections/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to delete section");
        return;
      }
      setSections((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Something went wrong while deleting section");
    }
  }

  return (
    <section className="mb-6 border border-gta-border dark:border-slate-700 rounded-xl p-4 bg-gta-surface dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h2 className="font-semibold text-gta-text dark:text-slate-100">Sections (for organizing lessons)</h2>
        {loading && <p className="text-xs text-gta-textSecondary dark:text-slate-400">Loading…</p>}
      </div>
      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="grid gap-4 md:grid-cols-[2fr,3fr]">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gta-text dark:text-slate-100 mb-1">
              Section name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gta-border dark:border-slate-700 rounded-lg bg-gta-surfaceSecondary dark:bg-slate-800 text-sm text-gta-text dark:text-slate-100"
              placeholder="e.g. Qur'an lessons"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gta-text dark:text-slate-100 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gta-border dark:border-slate-700 rounded-lg bg-gta-surfaceSecondary dark:bg-slate-800 text-sm text-gta-text dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gta-text dark:text-slate-100 mb-1">
              Thumbnail (PNG, max 2MB, optional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/png"
                onChange={handleThumbnailChange}
                disabled={thumbnailUploading}
                className="text-xs"
              />
              {thumbnailUploading && (
                <span className="text-xs text-gta-textSecondary dark:text-slate-400">Uploading…</span>
              )}
            </div>
            {thumbnailUrl && (
              <div className="mt-2 inline-block">
                <Image
                  src={thumbnailUrl}
                  alt="Section thumbnail"
                  width={120}
                  height={80}
                  className="rounded-lg object-cover w-30 h-20"
                />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 btn-kid-primary rounded-gta-sm text-sm disabled:opacity-60"
          >
            {saving ? "Saving…" : "Create section"}
          </button>
        </form>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {sections.length === 0 ? (
            <p className="text-sm text-gta-textSecondary dark:text-slate-400">
              No sections yet. Create one on the left to start organizing lessons.
            </p>
          ) : (
            sections.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 border border-gta-border/70 dark:border-slate-700 rounded-lg px-3 py-2 bg-gta-surfaceSecondary dark:bg-slate-800"
              >
                {s.thumbnail_url && (
                  <div className="relative w-12 h-10 overflow-hidden rounded-md shrink-0">
                    <Image src={s.thumbnail_url} alt={s.title} fill className="object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gta-text dark:text-slate-100 truncate">
                    {s.title}
                  </p>
                  {s.description && (
                    <p className="text-xs text-gta-textSecondary dark:text-slate-400 truncate">
                      {s.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

