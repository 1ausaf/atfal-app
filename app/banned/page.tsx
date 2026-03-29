import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function BannedPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "tifl") redirect("/dashboard");
  if (!session.user.isBanned) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full card-kid p-6 text-center">
        <h1 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">Account Banned</h1>
        <p className="text-slate-700 dark:text-slate-300 mb-4">
          Your account has been restricted by your Nazim team.
        </p>
        <div className="rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-950/30 p-4 text-left mb-6">
          <p className="text-xs uppercase tracking-wide text-red-700 dark:text-red-300 mb-1">Reason</p>
          <p className="text-sm text-red-900 dark:text-red-100">
            {session.user.bannedReason ?? "No reason provided."}
          </p>
        </div>
        <Link
          href="/api/auth/signout"
          className="inline-block px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
        >
          Sign out
        </Link>
      </div>
    </div>
  );
}
