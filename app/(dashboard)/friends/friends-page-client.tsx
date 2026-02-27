"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Friend = { id: string; name: string | null };
type Incoming = { id: string; from_user_id: string; from_name: string; initial_message: string | null; created_at: string };
type Outgoing = { id: string; to_user_id: string; to_name: string; created_at: string };

export function FriendsPageClient({
  friends,
  incoming,
  outgoing,
}: {
  friends: Friend[];
  incoming: Incoming[];
  outgoing: Outgoing[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const [openingChat, setOpeningChat] = useState<string | null>(null);

  async function openChat(otherUserId: string) {
    setOpeningChat(otherUserId);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ other_user_id: otherUserId }),
      });
      const data = await res.json();
      if (res.ok) router.push(`/messages/${data.id}`);
      else alert(data.error ?? "Failed");
    } finally {
      setOpeningChat(null);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setSearchResults(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function sendRequest(toUserId: string) {
    setSending(toUserId);
    try {
      const res = await fetch("/api/friend-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_user_id: toUserId }),
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json();
        alert(data.error ?? "Failed");
      }
    } finally {
      setSending(null);
    }
  }

  async function respondToRequest(requestId: string, status: "accepted" | "rejected") {
    setResponding(requestId);
    try {
      const res = await fetch(`/api/friend-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json();
        alert(data.error ?? "Failed");
      }
    } finally {
      setResponding(null);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">Add friend</h2>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
          />
          <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            Search
          </button>
        </form>
        {searchResults.length > 0 && (
          <ul className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
            {searchResults.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-3">
                <span>{u.name ?? "—"}</span>
                <button
                  type="button"
                  onClick={() => sendRequest(u.id)}
                  disabled={sending === u.id}
                  className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  Send request
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {incoming.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">Incoming requests</h2>
          <ul className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
            {incoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-medium">{r.from_name}</p>
                  {r.initial_message && <p className="text-sm text-slate-500 dark:text-slate-400">{r.initial_message}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => respondToRequest(r.id, "accepted")}
                    disabled={responding === r.id}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => respondToRequest(r.id, "rejected")}
                    disabled={responding === r.id}
                    className="px-3 py-1.5 bg-slate-500 text-white text-sm rounded-lg hover:bg-slate-600 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">Outgoing requests</h2>
          <ul className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
            {outgoing.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <span>{r.to_name}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Pending</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-2">Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No friends yet. Search and send a request.</p>
        ) : (
          <ul className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
            {friends.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <span className="font-medium">{u.name ?? "—"}</span>
                <button
                  type="button"
                  onClick={() => openChat(u.id)}
                  disabled={openingChat === u.id}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                >
                  Message
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
