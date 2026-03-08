import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function ActivitiesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Activities</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Play WORDLE or explore Read for newsletters and other content.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/activities/wordle"
          className="card-kid p-6 transition-colors hover:shadow-gta-hover"
        >
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">WORDLE</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Guess the word in 6 tries.</p>
        </Link>
        <Link
          href="/activities/read"
          className="card-kid p-6 transition-colors hover:shadow-gta-hover"
        >
          <h2 className="font-semibold text-lg text-slate-900 dark:text-white">Read</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Newsletter and reading content</p>
        </Link>
      </div>
    </div>
  );
}
