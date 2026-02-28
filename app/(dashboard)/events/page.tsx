import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { CreateEventForm } from "./create-event-form";
import { EventItemActions } from "./event-item-actions";

const EVENT_TYPE_LABEL: Record<string, string> = {
  regional: "Regional",
  local: "Local",
  national: "National",
};

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("events")
    .select("id, title, description, location, link, event_type, majlis_id, event_date")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true });
  if (session.user.role === "tifl" && session.user.majlisId) {
    query = query.or(
      `event_type.eq.regional,event_type.eq.national,majlis_id.eq.${session.user.majlisId}`
    );
  }
  if (session.user.role === "local_nazim" && session.user.majlisId) {
    query = query.eq("majlis_id", session.user.majlisId);
  }
  const { data: events } = await query;
  const { data: majlis } = await supabase.from("majlis").select("id, name");
  const majlisMap = new Map((majlis ?? []).map((m) => [m.id, m.name]));
  const canCreate = session.user.role === "local_nazim" || session.user.role === "regional_nazim";
  const userMajlisId = session.user.majlisId ?? null;
  const role = session.user.role;
  function canEditEvent(e: { majlis_id: string | null }) {
    if (role === "regional_nazim") return true;
    if (role === "local_nazim" && userMajlisId && e.majlis_id === userMajlisId) return true;
    return false;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Upcoming events</h1>
        {canCreate && (
          <Link href="/events/new" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Create event
          </Link>
        )}
      </div>
      {canCreate && (
        <details className="mb-6">
          <summary className="cursor-pointer font-medium text-emerald-600 hover:text-emerald-700">Create new event</summary>
          <div className="mt-3">
            <CreateEventForm majlisList={majlis ?? []} role={session.user.role} defaultMajlisId={session.user.majlisId} />
          </div>
        </details>
      )}
      {!events?.length ? (
        <p className="text-slate-500 dark:text-slate-400">No upcoming events.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((e) => (
            <li key={e.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-card p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <span className="font-semibold text-lg">{e.title}</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-sm bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                    {EVENT_TYPE_LABEL[e.event_type] ?? e.event_type}
                  </span>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{new Date(e.event_date).toLocaleString()}</p>
                  {e.location && <p className="text-sm text-slate-600 dark:text-slate-400">Location: {e.location}</p>}
                  {e.description && <p className="mt-2 text-slate-600 dark:text-slate-400">{e.description}</p>}
                  {e.link && (
                    <a href={e.link} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 hover:underline transition-colors text-sm mt-2 inline-block">
                      Link
                    </a>
                  )}
                </div>
                <EventItemActions eventId={e.id} canEdit={canEditEvent(e)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
