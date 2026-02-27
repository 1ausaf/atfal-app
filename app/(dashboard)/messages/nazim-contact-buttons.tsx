"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Contact = { id: string; name: string } | null;

export function NazimContactButtons() {
  const router = useRouter();
  const [localNazim, setLocalNazim] = useState<Contact>(null);
  const [regionalNazim, setRegionalNazim] = useState<Contact>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/nazim-contacts")
      .then((r) => r.json())
      .then((data) => {
        setLocalNazim(data.local_nazim ?? null);
        setRegionalNazim(data.regional_nazim ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function startChat(userId: string) {
    setStarting(userId);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ other_user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to start chat");
        return;
      }
      router.push(`/messages/${data.id}`);
      router.refresh();
    } finally {
      setStarting(null);
    }
  }

  if (loading) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {localNazim && (
        <button
          type="button"
          onClick={() => startChat(localNazim.id)}
          disabled={!!starting}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          {starting === localNazim.id ? "Opening…" : "Message Local Nazim Atfal"}
        </button>
      )}
      {regionalNazim && (
        <button
          type="button"
          onClick={() => startChat(regionalNazim.id)}
          disabled={!!starting}
          className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
        >
          {starting === regionalNazim.id ? "Opening…" : "Message Ausaf Bhai, Regional Nazim Atfal"}
        </button>
      )}
    </div>
  );
}
