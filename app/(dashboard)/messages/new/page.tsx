import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { NewChatClient } from "./new-chat-client";

export default async function NewMessagePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/messages" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-4 inline-block">
        ← Back to Messages
      </Link>
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">New chat</h1>
      <NewChatClient role={session.user.role} majlisId={session.user.majlisId} />
    </div>
  );
}
