import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { formatDateTimeInToronto } from "@/lib/datetime";
import Link from "next/link";

export default async function AdminChatsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin") redirect("/dashboard");

  const supabase = createSupabaseServerClient();
  const { data: convs } = await supabase.from("conversations").select("id, created_at").order("created_at", { ascending: false }).limit(200);
  const convIds = (convs ?? []).map((c) => c.id);
  const { data: parts } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", convIds);
  const userIds = [...new Set((parts ?? []).map((p) => p.user_id))];
  const { data: users } = await supabase.from("users").select("id, name, role, member_code").in("id", userIds);
  const userMap = new Map((users ?? []).map((u) => [u.id, u]));
  const participantsByConv = new Map<string, { user_id: string; name: string; role: string; member_code: string }[]>();
  (parts ?? []).forEach((p) => {
    const u = userMap.get(p.user_id);
    const mc = (u as { member_code?: string } | undefined)?.member_code ?? "—";
    if (!participantsByConv.has(p.conversation_id))
      participantsByConv.set(p.conversation_id, []);
    participantsByConv.get(p.conversation_id)!.push({
      user_id: p.user_id,
      name: u?.name ?? "—",
      role: u?.role ?? "—",
      member_code: mc,
    });
  });

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/admin" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-4 inline-block">
        ← Admin
      </Link>
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">All Chats</h1>
      <div className="card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-800 overflow-hidden">
        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
          {(convs ?? []).map((c) => {
            const participants = participantsByConv.get(c.id) ?? [];
            const label = participants.map((p) => `${p.name} (${p.role})`).join(" — ");
            const memberCodes = participants.map((p) => `@${p.member_code}`).join(" · ");
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <p className="font-medium text-slate-800 dark:text-slate-200">{label || "—"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{memberCodes}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTimeInToronto(c.created_at)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
        {(!convs || convs.length === 0) && (
          <p className="p-6 text-slate-500 dark:text-slate-400">No conversations yet.</p>
        )}
      </div>
    </div>
  );
}
