"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

interface LessonData {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  type: string;
  thumbnail_url?: string | null;
}

interface EditLessonFormProps {
  activity: LessonData;
}

export function EditLessonForm({ activity }: EditLessonFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState(activity.description ?? "");
  const [link, setLink] = useState(activity.link ?? "");
  const [type, setType] = useState<"video" | "article">(activity.type === "article" ? "article" : "video");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(activity.thumbnail_url ?? null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const res = await fetch(`/api/lessons/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          link: link.trim() || null,
          type,
          thumbnail_url: thumbnailUrl,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to update");
        setLoading(false);
        return;
      }
      router.push(`/lessons/${activity.id}`);
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
      <div>
        <label className="block text-sm font-medium mb-1">Thumbnail (PNG, max 2MB)</label>
        {thumbnailUrl && (
          <div className="mb-2 relative inline-block">
            <Image
              src={thumbnailUrl}
              alt="Thumbnail"
              width={120}
              height={90}
              className="rounded border border-slate-200 dark:border-slate-600 object-cover"
            />
            <button
              type="button"
              onClick={() => setThumbnailUrl(null)}
              className="absolute top-0 right-0 mt-1 mr-1 px-1.5 py-0.5 text-xs bg-red-600 text-white rounded hover:bg-red-700"
            >
              Remove
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/png"
          onChange={handleThumbnailChange}
          disabled={thumbnailUploading}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-emerald-600 file:text-white"
        />
        {thumbnailUploading && <p className="text-sm text-slate-500 mt-1">Uploading…</p>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="px-4 py-2 btn-kid-primary rounded-xl disabled:opacity-50 disabled:transform-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none">
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
