"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Friend = { id: string; name: string | null; member_code?: string };
type Incoming = { id: string; from_user_id: string; from_name: string; from_member_code?: string; initial_message: string | null; created_at: string };
type Outgoing = { id: string; to_user_id: string; to_name: string; to_member_code?: string; created_at: string };

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
  const [searchResults, setSearchResults] = useState<{ id: string; name: string | null; member_code?: string }[]>([]);
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
        <h2 className="font-bold text-lg text-gta-text mb-2">Add friend</h2>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="flex-1 px-3 py-2 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text"
          />
          <button type="submit" disabled={loading} className="px-4 py-2 btn-kid-primary rounded-gta disabled:opacity-50 disabled:transform-none">
            Search
          </button>
        </form>
        {searchResults.length > 0 && (
          <ul className="card-kid divide-y divide-gta-border overflow-hidden p-0">
            {searchResults.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-semibold text-gta-text">{u.name ?? "—"}</span>
                  <span className="block text-sm text-gta-textSecondary">@{u.member_code ?? "—"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => sendRequest(u.id)}
                  disabled={sending === u.id}
                  className="px-3 py-1.5 btn-kid-primary text-sm rounded-gta disabled:opacity-50 disabled:transform-none"
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
          <h2 className="font-bold text-lg text-gta-text mb-2">Incoming requests</h2>
          <ul className="card-kid divide-y divide-gta-border overflow-hidden p-0">
            {incoming.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-semibold text-gta-text">{r.from_name}</p>
                  <p className="text-sm text-gta-textSecondary">@{r.from_member_code ?? "—"}</p>
                  {r.initial_message && <p className="text-sm text-gta-textSecondary">{r.initial_message}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => respondToRequest(r.id, "accepted")}
                    disabled={responding === r.id}
                    className="px-3 py-1.5 btn-kid-primary text-sm rounded-gta disabled:opacity-50 disabled:transform-none"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => respondToRequest(r.id, "rejected")}
                    disabled={responding === r.id}
                    className="px-3 py-1.5 bg-gta-textSecondary text-white text-sm rounded-gta-sm hover:bg-gta-text disabled:opacity-50 font-medium"
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
          <h2 className="font-bold text-lg text-gta-text mb-2">Outgoing requests</h2>
          <ul className="card-kid divide-y divide-gta-border overflow-hidden p-0">
            {outgoing.map((r) => (
              <li key={r.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="font-semibold text-gta-text">{r.to_name}</span>
                  <span className="block text-sm text-gta-textSecondary">@{r.to_member_code ?? "—"}</span>
                </div>
                <span className="text-sm text-gta-textSecondary">Pending</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="font-bold text-lg text-gta-text mb-2">Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-gta-textSecondary">No friends yet. Search and send a request.</p>
        ) : (
          <ul className="card-kid divide-y divide-gta-border overflow-hidden p-0">
            {friends.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-gta-surfaceSecondary/80">
                <div>
                  <span className="font-semibold text-gta-text">{u.name ?? "—"}</span>
                  <span className="block text-sm text-gta-textSecondary">@{u.member_code ?? "—"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => openChat(u.id)}
                  disabled={openingChat === u.id}
                  className="link-kid text-sm disabled:opacity-50"
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
