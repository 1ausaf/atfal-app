"use client";

import { useState } from "react";

export function FoundationsPdfUpload({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }
    const nameLooksPdf = file.name.toLowerCase().endsWith(".pdf");
    const typeLooksPdf = file.type === "application/pdf";
    if (!nameLooksPdf && !typeLooksPdf) {
      setError(`Selected file is not recognized as PDF (name: ${file.name}, type: ${file.type || "unknown"}).`);
      return;
    }
    setError(null);
    setWarning(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.set("pdf", file);
      const res = await fetch("/api/religious-knowledge/foundations-pdf", { method: "POST", body: form });
      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        // non-json response
      }
      if (!res.ok) {
        setError(`${res.status} ${res.statusText}${data.error ? ` - ${String(data.error)}` : ""}`);
        return;
      }
      if (data.warning) setWarning(String(data.warning));
      setUrl((data.file_url as string | null) ?? null);
      setFile(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
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
      {warning && <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">{warning}</p>}
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
