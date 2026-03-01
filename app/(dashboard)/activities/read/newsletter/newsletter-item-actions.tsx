"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Item = {
  id: string;
  title: string;
  document_url: string;
  cover_url: string | null;
};

export function NewsletterItemActions({
  item,
  canEdit,
}: {
  item: Item;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this newsletter document?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/activities/newsletter/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const d = await res.json();
        alert(d.error ?? "Failed to delete");
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card overflow-hidden group/card flex flex-col">
      <a
        href={item.document_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex flex-col hover:border-emerald-500 dark:hover:border-emerald-600 transition-colors"
      >
        <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          {item.cover_url ? (
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.cover_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-slate-400 dark:text-slate-500 text-4xl" aria-hidden>
              📄
            </span>
          )}
        </div>
        <div className="p-3">
          <span className="font-medium text-slate-900 dark:text-white group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400 line-clamp-2">
            {item.title}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Open</span>
        </div>
      </a>
      {canEdit && (
        <div className="p-3 pt-0 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700">
          <Link
            href={`/activities/read/newsletter/${item.id}/edit`}
            className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Edit
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}
