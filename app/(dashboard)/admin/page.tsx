import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-gta-text">Admin</h1>
      <ul className="space-y-2">
        <li>
          <Link href="/admin/analytics" className="link-kid font-medium">
            Analytics — Active Tifls by Majlis
          </Link>
        </li>
        <li>
          <Link href="/admin/analytics/lesson-completion" className="link-kid font-medium">
            Analytics — Lesson completion (Atfal)
          </Link>
        </li>
        <li>
          <Link href="/admin/chats" className="link-kid font-medium">
            All Chats — View all conversations
          </Link>
        </li>
      </ul>
    </div>
  );
}
