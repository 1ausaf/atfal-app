"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HomeworkItemActionsProps {
  homeworkId: string;
  canEdit: boolean;
}

export function HomeworkItemActions({ homeworkId, canEdit }: HomeworkItemActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this homework? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/homework/${homeworkId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        const isNotFound = res.status === 404;
        alert(isNotFound ? "This homework may already have been deleted. The list will refresh." : (d.error ?? "Failed to delete"));
        if (isNotFound) router.refresh();
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (!canEdit) return null;
  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className="flex items-center gap-2">
        <Link
          href={`/homework/${homeworkId}/edit`}
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
      <Link href={`/homework/${homeworkId}/submissions`} className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">
        View submissions
      </Link>
    </div>
  );
}
