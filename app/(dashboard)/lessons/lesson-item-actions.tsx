"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LessonItemActionsProps {
  activityId: string;
  canEdit: boolean;
}

export function LessonItemActions({ activityId, canEdit }: LessonItemActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this lesson activity? All questions and submissions will be removed. This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/lessons/${activityId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Failed to delete");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (!canEdit) return null;
  return (
    <div className="flex items-center gap-2 shrink-0">
      <Link
        href={`/lessons/${activityId}/edit`}
        className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
      >
        {deleting ? "Deleting…" : "Delete"}
      </button>
    </div>
  );
}
