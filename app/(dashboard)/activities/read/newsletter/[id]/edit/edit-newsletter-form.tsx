"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Item = {
  id: string;
  title: string;
  document_url: string;
  cover_url: string | null;
  order: number;
};

export function EditNewsletterForm({ item }: { item: Item }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [documentUrl, setDocumentUrl] = useState(item.document_url);
  const [coverUrl, setCoverUrl] = useState(item.cover_url ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [order, setOrder] = useState(item.order);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let finalCoverUrl: string | null = coverUrl.trim() || null;
      if (coverFile && coverFile.type === "image/png") {
        const form = new FormData();
        form.set("cover", coverFile);
        const up = await fetch("/api/activities/newsletter/upload", { method: "POST", body: form });
        const upData = await up.json();
        if (!up.ok) {
          setError(upData.error ?? "Cover upload failed");
          setLoading(false);
          return;
        }
        finalCoverUrl = upData.url;
      }
      const res = await fetch(`/api/activities/newsletter/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          document_url: documentUrl.trim(),
          cover_url: finalCoverUrl,
          order: Number(order) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update");
        setLoading(false);
        return;
      }
      router.push("/activities/read/newsletter");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6"
    >
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none transition-colors"
        />
      </div>
      <div>
        <label htmlFor="document_url" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          Document URL
        </label>
        <input
          id="document_url"
          type="url"
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
          required
          placeholder="https://..."
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          Cover image <span className="text-slate-500 font-normal">(optional)</span>
        </label>
        <div className="space-y-2">
          <input
            type="file"
            ref={coverFileInputRef}
            accept="image/png"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setCoverFile(f ?? null);
              if (f) setCoverUrl("");
            }}
            className="w-full text-sm text-slate-600 dark:text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-900/30 dark:file:text-emerald-300"
          />
          <p className="text-xs text-slate-500">PNG only, max 2MB. Or change URL below.</p>
          <input
            id="cover_url"
            type="url"
            value={coverUrl}
            onChange={(e) => {
              setCoverUrl(e.target.value);
              if (e.target.value) setCoverFile(null);
            }}
            placeholder="https://..."
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none transition-colors"
          />
        </div>
      </div>
      <div>
        <label htmlFor="order" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
          Order
        </label>
        <input
          id="order"
          type="number"
          value={order}
          onChange={(e) => setOrder(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none transition-colors"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        <Link
          href="/activities/read/newsletter"
          className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
