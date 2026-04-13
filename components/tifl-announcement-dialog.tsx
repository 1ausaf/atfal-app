"use client";

import { useCallback, useEffect, useState } from "react";

export type TiflAnnouncementPayload = {
  id: string;
  title: string | null;
  body: string;
};

export function TiflAnnouncementDialog({
  initialAnnouncement,
}: {
  initialAnnouncement: TiflAnnouncementPayload | null;
}) {
  const [open, setOpen] = useState(initialAnnouncement !== null);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const announcement = initialAnnouncement;

  const handleClose = useCallback(async () => {
    if (!announcement || closing) return;
    setError(null);
    setClosing(true);
    setOpen(false);
    try {
      const res = await fetch("/api/tifl-announcement/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcement_id: announcement.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOpen(true);
        setError(typeof data.error === "string" ? data.error : "Could not save. Try again.");
      }
    } catch {
      setOpen(true);
      setError("Could not save. Try again.");
    } finally {
      setClosing(false);
    }
  }, [announcement, closing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  if (!announcement || !open) return null;

  const heading = announcement.title?.trim() || "Announcement";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tifl-announcement-title"
    >
      <div className="relative rounded-gta shadow-gta bg-gta-surface border border-gta-border max-w-lg w-full max-h-[90vh] overflow-auto p-6">
        <button
          type="button"
          onClick={handleClose}
          disabled={closing}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-gta-surfaceSecondary hover:bg-gta-border flex items-center justify-center text-gta-text disabled:opacity-50"
          aria-label="Close"
        >
          ×
        </button>
        <h2 id="tifl-announcement-title" className="text-xl font-bold text-gta-text pr-10 mb-3">
          {heading}
        </h2>
        <p className="text-gta-text whitespace-pre-wrap text-base leading-relaxed">{announcement.body}</p>
        {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
