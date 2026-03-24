"use client";

import { useState } from "react";

export function FoundationsPdfUpload({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.set("pdf", file);
      const res = await fetch("/api/religious-knowledge/foundations-pdf", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setUrl(data.file_url ?? null);
      setFile(null);
    } catch {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleUpload} className="card-kid p-4 mb-5">
      <h2 className="font-bold text-gta-text text-lg">FOUNDATIONS PDF (Checkpoint 1)</h2>
      <p className="text-sm text-gta-textSecondary mt-1">
        Upload the latest practice file for tifls. They will study this exact PDF before testing.
      </p>
      <div className="mt-3 flex flex-wrap gap-3 items-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-gta-textSecondary"
        />
        <button type="submit" disabled={loading || !file} className="btn-kid-primary px-4 py-2 rounded-gta disabled:opacity-50">
          {loading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
      {url && (
        <p className="text-sm text-gta-textSecondary mt-2">
          Current file:{" "}
          <a href={url} target="_blank" rel="noreferrer" className="link-kid">
            Open PDF
          </a>
        </p>
      )}
    </form>
  );
}
