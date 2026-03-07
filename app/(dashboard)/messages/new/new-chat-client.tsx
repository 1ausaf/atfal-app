"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function NewChatClient({
  role,
  majlisId,
}: {
  role: string;
  majlisId: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<{ id: string; name: string | null; member_code?: string }[]>([]);
  const [tiflList, setTiflList] = useState<{ id: string; name: string | null; member_code?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (role === "local_nazim" || role === "regional_nazim" || role === "admin") {
      fetch("/api/tifls")
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.users ?? data?.list ?? [];
          setTiflList(list.map((u: { id: string; name?: string | null; member_code?: string }) => ({ id: u.id, name: u.name ?? null, member_code: u.member_code ?? undefined })));
        })
        .catch(() => setTiflList([]));
    }
  }, [role]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function startChat(otherUserId: string) {
    setCreating(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ other_user_id: otherUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to start chat");
        return;
      }
      router.push(`/messages/${data.id}`);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  const isNazim = role === "local_nazim" || role === "regional_nazim" || role === "admin";

  return (
    <div className="space-y-4">
      {role === "tifl" && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends by name…"
            className="flex-1 px-3 py-2 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
          />
          <button type="submit" disabled={loading} className="px-4 py-2 btn-kid-primary rounded-xl disabled:opacity-50 disabled:transform-none">
            Search
          </button>
        </form>
      )}
      {role === "tifl" && users.length > 0 && (
        <ul className="card-kid divide-y divide-gta-border overflow-hidden p-0">
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => startChat(u.id)}
                disabled={creating}
                className="w-full text-left px-4 py-3 hover:bg-gta-surfaceSecondary/80 disabled:opacity-50"
              >
                <span>{u.name ?? "—"}</span>
                <span className="block text-sm text-gta-textSecondary">@{u.member_code ?? "—"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {role === "tifl" && query && !loading && users.length === 0 && (
        <p className="text-gta-textSecondary">No friends found. Add friends first from the Friends page.</p>
      )}
      {isNazim && tiflList.length > 0 && (
        <ul className="card-kid divide-y divide-gta-border overflow-hidden p-0">
          <li className="px-4 py-2 text-sm text-gta-textSecondary">Select a Tifl to message</li>
          {tiflList.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => startChat(u.id)}
                disabled={creating}
                className="w-full text-left px-4 py-3 hover:bg-gta-surfaceSecondary/80 disabled:opacity-50"
              >
                <span>{u.name ?? "—"}</span>
                <span className="block text-sm text-gta-textSecondary">@{u.member_code ?? "—"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {isNazim && tiflList.length === 0 && (
        <p className="text-gta-textSecondary">No Tifls to message yet.</p>
      )}
    </div>
  );
}
