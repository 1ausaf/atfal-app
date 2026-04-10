import type { SupabaseClient } from "@supabase/supabase-js";

const TORONTO_TZ = "America/Toronto";

/** YYYY-MM-DD in Toronto for an ISO timestamp (e.g. season starts_at). */
export function toTorontoYmdFromIso(iso: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TORONTO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(iso));
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

/**
 * True when activity_date (YYYY-MM-DD, Toronto calendar day) is on or after
 * the active season's start date in Toronto (same string format).
 */
export function isTorontoActivityDateInActiveSeason(
  activityDateYmd: string,
  activeSeasonStartIso: string | null
): boolean {
  if (!activeSeasonStartIso) return false;
  const seasonStartYmd = toTorontoYmdFromIso(activeSeasonStartIso);
  return activityDateYmd >= seasonStartYmd;
}

export async function getActiveSeasonStartIso(
  supabase: SupabaseClient
): Promise<string | null> {
  const { data } = await supabase
    .from("majlis_competition_seasons")
    .select("starts_at")
    .eq("is_active", true)
    .maybeSingle();
  return data?.starts_at ?? null;
}

export function isLessonSeasonEligibleByCutoff(
  lessonCreatedAt: string | null | undefined,
  activeSeasonStartIso: string | null
): boolean {
  if (!lessonCreatedAt || !activeSeasonStartIso) return false;
  return new Date(lessonCreatedAt).getTime() >= new Date(activeSeasonStartIso).getTime();
}

export async function incrementUserSeason2Points(
  supabase: SupabaseClient,
  userId: string,
  by: number
): Promise<void> {
  const delta = Math.max(0, Math.floor(Number(by) || 0));
  if (delta <= 0) return;

  const { data: userRow } = await supabase
    .from("users")
    .select("season2_points")
    .eq("id", userId)
    .maybeSingle();

  const current = Math.max(0, Number(userRow?.season2_points ?? 0));
  await supabase
    .from("users")
    .update({
      season2_points: current + delta,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function applyUserSeason2PointsDelta(
  supabase: SupabaseClient,
  userId: string,
  by: number
): Promise<void> {
  const delta = Math.floor(Number(by) || 0);
  if (delta === 0) return;

  const { data: userRow } = await supabase
    .from("users")
    .select("season2_points")
    .eq("id", userId)
    .maybeSingle();

  const current = Math.max(0, Number(userRow?.season2_points ?? 0));
  const next = Math.max(0, current + delta);
  await supabase
    .from("users")
    .update({
      season2_points: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
