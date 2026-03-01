"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [memberCode, setMemberCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        member_code: memberCode.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid member code or password. Use the code and password assigned by your admin.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-slate-900">
      <div className="w-full max-w-sm card-kid rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/50 bg-white dark:bg-slate-800 shadow-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-2 text-slate-800 dark:text-white">Create your account</h1>
        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-6">
          Enter the member code and password given to you by your admin.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="member_code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Member code
            </label>
            <input
              id="member_code"
              name="member_code"
              type="text"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
              required
              className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 btn-kid-primary rounded-xl disabled:opacity-50 disabled:transform-none"
          >
            {loading ? "Continuing…" : "Continue"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account? <Link href="/login" className="link-kid font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
