"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const AGE_GROUP_OPTIONS = [
  { value: "all", label: "All age groups" },
  { value: "7-9", label: "Ages 7-9" },
  { value: "10-11", label: "Ages 10-11" },
  { value: "12-14", label: "Ages 12-14" },
] as const;

export function CreateLessonForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState<"video" | "article">("video");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<{ id: string; title: string }[]>([]);
  const [sectionId, setSectionId] = useState<string>("");
  const [targetAgeGroups, setTargetAgeGroups] = useState<string[]>(["all"]);

  useEffect(() => {
    fetch("/api/lessons/sections")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setSections(data.map((s: { id: string; title: string }) => ({ id: s.id, title: s.title })));
        }
      })
      .catch(() => {});
  }, []);

  function toggleAgeGroup(value: string) {
    setTargetAgeGroups((current) => {
      if (value === "all") return ["all"];
      const withoutAll = current.filter((item) => item !== "all");
      if (withoutAll.includes(value)) {
        const next = withoutAll.filter((item) => item !== value);
        return next.length > 0 ? next : ["all"];
      }
      return [...withoutAll, value];
    });
  }

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
    setError("");
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          link: link.trim() || null,
          type,
          thumbnail_url: thumbnailUrl || null,
          section_id: sectionId || null,
          target_age_groups: targetAgeGroups,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to create");
        setLoading(false);
        return;
      }
      const d = await res.json();
      router.push(`/lessons/${d.id}/questions`);
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
        <label className="block text-sm font-medium mb-1">Link (e.g. YouTube)</label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "video" | "article")}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        >
          <option value="video">Video</option>
          <option value="article">Article</option>
        </select>
      </div>
      {sections.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Section (optional)</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
          >
            <option value="">Uncategorized</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Age-group visibility</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AGE_GROUP_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={targetAgeGroups.includes(option.value)}
                onChange={() => toggleAgeGroup(option.value)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Thumbnail (PNG, max 2MB)</label>
        <input
          type="file"
          accept="image/png"
          onChange={handleThumbnailChange}
          disabled={thumbnailUploading}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-emerald-600 file:text-white"
        />
        {thumbnailUploading && <p className="text-sm text-slate-500 mt-1">Uploading…</p>}
        {thumbnailUrl && (
          <p className="text-sm text-emerald-600 mt-1">Thumbnail added. Clear file input to keep; upload another to replace.</p>
        )}
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button type="submit" disabled={loading} className="px-4 py-2 btn-kid-primary rounded-xl disabled:opacity-50 disabled:transform-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none">
        {loading ? "Creating…" : "Create and add questions"}
      </button>
    </form>
  );
}
