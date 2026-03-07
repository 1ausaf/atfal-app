import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { formatDateTimeInToronto, getStartOfTodayTorontoISO } from "@/lib/datetime";
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
  const threshold = getStartOfTodayTorontoISO();
  let query = supabase
    .from("events")
    .select("id, title, description, location, link, event_type, majlis_id, event_date")
    .gte("event_date", threshold)
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
  const canCreate = session.user.role === "local_nazim" || session.user.role === "regional_nazim" || session.user.role === "admin";
  const userMajlisId = session.user.majlisId ?? null;
  const role = session.user.role;
  function canEditEvent(e: { majlis_id: string | null }) {
    if (role === "regional_nazim" || role === "admin") return true;
    if (role === "local_nazim" && userMajlisId && e.majlis_id === userMajlisId) return true;
    return false;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gta-text">Upcoming events</h1>
        {canCreate && (
          <Link href="/events/new" className="px-4 py-2 btn-kid-primary rounded-xl inline-block">
            Create event
          </Link>
        )}
      </div>
      {canCreate && (
        <details className="mb-6">
          <summary className="cursor-pointer font-semibold text-gta-primary hover:underline">Create new event</summary>
          <div className="mt-3">
            <CreateEventForm majlisList={majlis ?? []} role={session.user.role} defaultMajlisId={session.user.majlisId} />
          </div>
        </details>
      )}
      {!events?.length ? (
        <p className="text-gta-textSecondary">No upcoming events.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((e) => (
            <li key={e.id} className="content-module-item">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <span className="font-semibold text-lg text-gta-text">{e.title}</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-sm bg-gta-secondary text-white font-medium">
                    {EVENT_TYPE_LABEL[e.event_type] ?? e.event_type}
                  </span>
                  <p className="text-sm text-gta-textSecondary mt-1">{formatDateTimeInToronto(e.event_date)}</p>
                  {e.location && <p className="text-sm text-gta-textSecondary">Location: {e.location}</p>}
                  {e.description && <p className="mt-2 text-gta-textSecondary">{e.description}</p>}
                  {e.link && (
                    <a href={e.link} target="_blank" rel="noopener noreferrer" className="link-kid text-sm mt-2 inline-block">
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
