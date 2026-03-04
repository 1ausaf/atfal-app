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
  const isRegionalOrAdmin = session.user.role === "regional_nazim" || session.user.role === "admin";

  let convIds: string[];
  if (isRegionalOrAdmin) {
    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(200);
    convIds = (convs ?? []).map((c) => c.id);
  } else {
    const { data: participants } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", session.user.id);
    convIds = [...new Set((participants ?? []).map((p) => p.conversation_id))];
  }

  let conversations: { id: string; other_name: string; last_message: string | null }[] = [];
  if (convIds.length) {
    const { data: allParts } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds);
    const userIds = [...new Set((allParts ?? []).map((p) => p.user_id))];
    const { data: users } = await supabase.from("users").select("id, name, role").in("id", userIds);
    const userMap = new Map((users ?? []).map((u) => [u.id, u]));

    const partsByConv = new Map<string, { user_id: string; name: string; role: string }[]>();
    (allParts ?? []).forEach((p) => {
      const u = userMap.get(p.user_id);
      if (!partsByConv.has(p.conversation_id)) partsByConv.set(p.conversation_id, []);
      partsByConv.get(p.conversation_id)!.push({
        user_id: p.user_id,
        name: u?.name ?? "—",
        role: u?.role ?? "—",
      });
    });

    const { data: lastMsgs } = await supabase
      .from("messages")
      .select("conversation_id, body, created_at")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false });
    const lastByConv = new Map<string, { body: string; created_at: string }>();
    (lastMsgs ?? []).forEach((m) => {
      if (!lastByConv.has(m.conversation_id))
        lastByConv.set(m.conversation_id, { body: m.body, created_at: m.created_at });
    });

    conversations = convIds.map((cid) => {
      const participantsList = partsByConv.get(cid) ?? [];
      const label = isRegionalOrAdmin
        ? participantsList.map((p) => `${p.name} (${p.role})`).join(" — ")
        : participantsList.find((p) => p.user_id !== session.user.id)?.name ?? "—";
      return {
        id: cid,
        other_name: label || "—",
        last_message: lastByConv.get(cid)?.body ?? null,
      };
    });
    conversations.sort((a, b) => {
      const tA = lastByConv.get(a.id)?.created_at ?? "";
      const tB = lastByConv.get(b.id)?.created_at ?? "";
      return tB > tA ? 1 : -1;
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Messages</h1>
        <Link
          href="/messages/new"
          className="px-4 py-2 btn-kid-primary rounded-xl text-sm font-medium"
        >
          New chat
        </Link>
      </div>
      {session.user.role === "tifl" && <NazimContactButtons />}
      {!conversations.length ? (
        <p className="text-slate-500 dark:text-slate-400">No conversations yet. Start a new chat.</p>
      ) : (
        <ul className="card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-800 shadow-lg divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
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
