import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6">
      <h1 className="text-3xl font-bold">GTA Centre Atfal</h1>
      <p className="text-gray-600 dark:text-gray-400">Gamified youth platform</p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Login
        </Link>
      </div>
    </main>
  );
}
