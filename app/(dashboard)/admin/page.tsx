import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim") redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Admin</h1>
      <ul className="space-y-2">
        <li>
          <Link href="/admin/analytics" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
            Analytics — Active Tifls by Majlis
          </Link>
        </li>
        <li>
          <Link href="/admin/chats" className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
            All Chats — View all conversations
          </Link>
        </li>
      </ul>
    </div>
  );
}
