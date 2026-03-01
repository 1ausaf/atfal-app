import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function SignOutPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="max-w-md mx-auto p-6 text-center card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-800 shadow-lg">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">Sign out</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">Are you sure you want to sign out?</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors font-medium"
        >
          Back
        </Link>
        <Link
          href="/api/auth/signout"
          className="px-5 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-medium shadow-md"
        >
          Sign out
        </Link>
      </div>
    </div>
  );
}
