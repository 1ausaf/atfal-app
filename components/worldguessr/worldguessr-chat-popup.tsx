"use client";

import { useMemo, useState } from "react";
import { formatDateTimeInToronto } from "@/lib/datetime";

type Friend = { id: string; name: string | null; member_code?: string | null };
type Message = { id: string; sender_id: string; body: string; created_at: string };

export function WorldguessrChatPopup({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [query, setQuery] = useState("");

  const [activeFriend, setActiveFriend] = useState<Friend | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredFriends = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => {
      const n = (f.name ?? "").toLowerCase();
      const m = (f.member_code ?? "").toLowerCase();
      return n.includes(q) || m.includes(q);
    });
  }, [friends, query]);

  async function ensureFriendsLoaded() {
    if (friendsLoaded || friendsLoading) return;
    setFriendsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unable to load friends.");
        return;
      }
      setFriends(data.friends ?? []);
      setFriendsLoaded(true);
    } catch {
      setError("Unable to load friends.");
    } finally {
      setFriendsLoading(false);
    }
  }

  async function openChatWith(friend: Friend) {
    setActiveFriend(friend);
    setStartingChat(true);
    setMessagesLoading(true);
    setError(null);
    try {
      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ other_user_id: friend.id }),
      });
      const convData = await convRes.json();
      if (!convRes.ok) {
        setError(convData.error ?? "Unable to open chat.");
        setMessages([]);
        setConversationId(null);
        return;
      }

      const convId = convData.id as string;
      setConversationId(convId);

      const msgRes = await fetch(`/api/conversations/${convId}/messages?limit=50`);
      const msgData = await msgRes.json();
      if (!msgRes.ok) {
        setError(msgData.error ?? "Unable to load messages.");
        setMessages([]);
        return;
      }
      setMessages(msgData.messages ?? []);
    } catch {
      setError("Unable to open chat.");
      setMessages([]);
      setConversationId(null);
    } finally {
      setStartingChat(false);
      setMessagesLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!conversationId || !trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send message.");
        return;
      }
      setMessages((prev) => [...prev, data]);
      setBody("");
    } catch {
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  }

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next) void ensureFriendsLoaded();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full btn-kid-primary shadow-gta"
        aria-label="Open game chat"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[28rem] max-h-[70vh] card-kid p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gta-border">
            <h2 className="font-semibold text-gta-text">Game Chat</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-gta-textSecondary hover:text-gta-text"
            >
              Close
            </button>
          </div>

          {error && <p className="px-4 pt-2 text-sm text-red-500">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-[12rem_1fr] min-h-[24rem] max-h-[calc(70vh-3.25rem)]">
            <div className="border-b sm:border-b-0 sm:border-r border-gta-border p-3 overflow-y-auto">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search friends"
                className="w-full mb-2 px-3 py-2 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text text-sm"
              />
              {friendsLoading ? (
                <p className="text-sm text-gta-textSecondary">Loading friends…</p>
              ) : filteredFriends.length === 0 ? (
                <p className="text-sm text-gta-textSecondary">No friends yet.</p>
              ) : (
                <ul className="space-y-1">
                  {filteredFriends.map((friend) => (
                    <li key={friend.id}>
                      <button
                        type="button"
                        onClick={() => openChatWith(friend)}
                        className={`w-full text-left px-2 py-2 rounded-lg text-sm transition-colors ${
                          activeFriend?.id === friend.id
                            ? "bg-gta-surfaceSecondary text-gta-text"
                            : "hover:bg-gta-surfaceSecondary/80 text-gta-textSecondary"
                        }`}
                      >
                        <span className="block font-medium text-gta-text">{friend.name ?? "—"}</span>
                        <span className="block text-xs">@{friend.member_code ?? "—"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col min-h-0">
              <div className="px-3 py-2 border-b border-gta-border text-sm text-gta-textSecondary">
                {activeFriend ? `Chatting with ${activeFriend.name ?? "Friend"}` : "Select a friend to start chatting"}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {startingChat || messagesLoading ? (
                  <p className="text-sm text-gta-textSecondary">Loading chat…</p>
                ) : !activeFriend ? (
                  <p className="text-sm text-gta-textSecondary">Choose a friend from the list.</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gta-textSecondary">No messages yet. Say salam!</p>
                ) : (
                  messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 ${
                          m.sender_id === currentUserId
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                        <p className="text-[10px] opacity-80 mt-1">{formatDateTimeInToronto(m.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSend} className="p-3 border-t border-gta-border flex gap-2">
                <input
                  type="text"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type message..."
                  disabled={!conversationId || sending}
                  className="flex-1 px-3 py-2 border border-gta-border rounded-gta-sm bg-gta-surface text-gta-text text-sm disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!conversationId || sending || !body.trim()}
                  className="px-3 py-2 btn-kid-primary rounded-gta text-sm disabled:opacity-50 disabled:transform-none"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
