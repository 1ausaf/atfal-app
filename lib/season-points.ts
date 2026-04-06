import type { SupabaseClient } from "@supabase/supabase-js";

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
