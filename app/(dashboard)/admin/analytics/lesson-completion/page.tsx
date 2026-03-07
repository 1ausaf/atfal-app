import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { LessonCompletionClient } from "./lesson-completion-client";

export default async function LessonCompletionAnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin"
        className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mb-4 inline-block"
      >
        ← Admin
      </Link>
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">
        Analytics — Lesson completion (Atfal)
      </h1>
      <LessonCompletionClient />
    </div>
  );
}
