import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { formatDateInToronto, getStartOfTodayTorontoISO } from "@/lib/datetime";

const EVENT_TYPE_LABEL: Record<string, string> = {
  regional: "Regional",
  local: "Local",
  national: "National",
};

export async function EventsWidget({ limit = 5 }: { limit?: number }) {
  const session = await getServerSession(authOptions);
  if (!session) return <p className="text-gray-500">Sign in to see events.</p>;
  const supabase = createSupabaseServerClient();
  const threshold = getStartOfTodayTorontoISO();
  let query = supabase
    .from("events")
    .select("id, title, event_type, event_date, majlis_id")
    .gte("event_date", threshold)
    .order("event_date", { ascending: true })
    .limit(limit);
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

  if (!events?.length) return <p className="text-slate-500 dark:text-slate-400">No upcoming events.</p>;
  return (
    <ul className="space-y-2">
      {events.map((e) => {
        const typeLabel = EVENT_TYPE_LABEL[e.event_type] ?? e.event_type;
        const majlisName = e.event_type === "local" && e.majlis_id ? majlisMap.get(e.majlis_id) : null;
        const typeDisplay = majlisName ? `${typeLabel} · ${majlisName}` : typeLabel;
        return (
          <li key={e.id} className="flex justify-between items-start gap-2 p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/80 dark:border-emerald-800/30">
            <div>
              <span className="font-medium text-slate-800 dark:text-white">{e.title}</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                {typeDisplay}
              </span>
            </div>
            <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {formatDateInToronto(e.event_date)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
