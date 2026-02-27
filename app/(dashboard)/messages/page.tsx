import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { NazimContactButtons } from "./nazim-contact-buttons";

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const supabase = createSupabaseServerClient();
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", session.user.id);
  const convIds = [...new Set((participants ?? []).map((p) => p.conversation_id))];
  let conversations: { id: string; other_name: string; last_message: string | null }[] = [];
  if (convIds.length) {
    const { data: allParts } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds);
    const otherByConv = new Map<string, string>();
    (allParts ?? []).forEach((p) => {
      if (p.user_id !== session.user.id) otherByConv.set(p.conversation_id, p.user_id);
    });
    const otherIds = [...otherByConv.values()];
    const { data: users } = await supabase.from("users").select("id, name").in("id", otherIds);
    const nameById = new Map((users ?? []).map((u) => [u.id, u.name]));
    const { data: lastMsgs } = await supabase
      .from("messages")
      .select("conversation_id, body, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false });
    const lastByConv = new Map<string, string>();
    (lastMsgs ?? []).forEach((m) => {
      if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m.body);
    });
    conversations = convIds.map((cid) => ({
      id: cid,
      other_name: nameById.get(otherByConv.get(cid) ?? "") ?? "—",
      last_message: lastByConv.get(cid) ?? null,
    }));
    conversations.sort((a, b) => 0);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Messages</h1>
        <Link
          href="/messages/new"
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          New chat
        </Link>
      </div>
      {session.user.role === "tifl" && <NazimContactButtons />}
      {!conversations.length ? (
        <p className="text-slate-500 dark:text-slate-400">No conversations yet. Start a new chat.</p>
      ) : (
        <ul className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <p className="font-medium text-slate-800 dark:text-slate-200">{c.other_name}</p>
                {c.last_message && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">{c.last_message}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
