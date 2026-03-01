import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-teal-950/30">
      <h1 className="text-4xl font-bold text-slate-800 dark:text-white tracking-tight">GTA Centre Atfal</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400">Digital Learning Platform</p>
      <div className="flex gap-4 mt-2">
        <Link
          href="/login"
          className="btn-kid-primary px-8 py-3 rounded-2xl text-lg inline-block"
        >
          Login
        </Link>
      </div>
    </main>
  );
}
