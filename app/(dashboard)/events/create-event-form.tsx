"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CreateEventFormProps {
  majlisList: { id: string; name: string }[];
  role: string;
  defaultMajlisId: string | null;
  majlisName?: string | null;
}

export function CreateEventForm({ majlisList, role, defaultMajlisId, majlisName }: CreateEventFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [eventType, setEventType] = useState(role === "local_nazim" ? "local" : "regional");
  const [majlisId, setMajlisId] = useState(defaultMajlisId ?? "");
  const [eventDate, setEventDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          location: location.trim() || null,
          link: link.trim() || null,
          event_type: eventType,
          majlis_id: eventType === "local" ? majlisId || null : null,
          event_date: eventDate,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to create");
        setLoading(false);
        return;
      }
      router.refresh();
      setTitle("");
      setDescription("");
      setLocation("");
      setLink("");
      setEventDate("");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Event type</label>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as "regional" | "local" | "national")}
          disabled={role === "local_nazim"}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        >
          {role === "regional_nazim" && <option value="regional">Regional</option>}
          <option value="local">Local</option>
          {role === "regional_nazim" && <option value="national">National</option>}
        </select>
      </div>
      {eventType === "local" && (
        <div>
          <label className="block text-sm font-medium mb-1">Majlis</label>
          {role === "local_nazim" ? (
            <p className="px-3 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg">
              {majlisName ?? "—"}
            </p>
          ) : (
            <select
              value={majlisId}
              onChange={(e) => setMajlisId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
            >
              <option value="">Select Majlis</option>
              {majlisList.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Date & time</label>
        <input
          type="datetime-local"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Link</label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 focus-visible:outline-none transition-colors">
        {loading ? "Creating…" : "Create event"}
      </button>
    </form>
  );
}
