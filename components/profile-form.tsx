"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Majlis = { id: string; name: string };
type UserForm = {
  name: string;
  date_of_birth: string;
  majlis_id: string;
  age: number | null;
  age_group: string | null;
};

export function ProfileForm({
  user,
  majlisList,
}: {
  user: UserForm;
  majlisList: Majlis[];
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [dateOfBirth, setDateOfBirth] = useState(user.date_of_birth);
  const [majlisId, setMajlisId] = useState(user.majlis_id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          date_of_birth: dateOfBirth || null,
          majlis_id: majlisId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      setSuccess(true);
      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
      </div>
      <div>
        <label htmlFor="date_of_birth" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Date of birth
        </label>
        <input
          id="date_of_birth"
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
        {user.age != null && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Age group: {user.age_group ?? "—"} (age {user.age} as of Oct 31)
          </p>
        )}
      </div>
      <div>
        <label htmlFor="majlis_id" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Majlis
        </label>
        <select
          id="majlis_id"
          value={majlisId}
          onChange={(e) => setMajlisId(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="">Select majlis</option>
          {majlisList.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile saved.</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
