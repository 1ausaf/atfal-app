import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { ThreadClient } from "./thread-client";

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: participants } = await supabase
    .from("conversation_participants")
    .select("user_id")
    .eq("conversation_id", id);
  const userIds = (participants ?? []).map((p) => p.user_id);
  const canAccess =
    userIds.includes(session.user.id) || session.user.role === "regional_nazim";
  if (!canAccess) notFound();

  const otherId = userIds.find((uid) => uid !== session.user.id);
  let otherName = "—";
  if (otherId) {
    const { data: u } = await supabase.from("users").select("name").eq("id", otherId).single();
    otherName = u?.name ?? "—";
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/messages" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-4 inline-block">
        ← Back to Messages
      </Link>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-4">{otherName}</h1>
      <ThreadClient conversationId={id} currentUserId={session.user.id} />
    </div>
  );
}
