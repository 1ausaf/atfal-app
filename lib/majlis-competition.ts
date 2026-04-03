import { createSupabaseServerClient } from "@/lib/supabase";

const MIN_COEFFICIENT = 0.65;
const MAX_COEFFICIENT = 1.35;

type ActiveSeason = {
  id: string;
  goal_points: number;
  prize: string;
  starts_at: string;
  ends_at: string;
};

type CoefficientRow = {
  member_count_snapshot: number;
  coefficient: number;
};

export type ContributionEventType = "login" | "wordle" | "crossword" | "homework" | "lesson" | "manual";

export function computeCoefficientFromCounts(memberCount: number, averageCount: number) {
  if (memberCount <= 0 || averageCount <= 0) return 0;
  const raw = averageCount / memberCount;
  return Math.min(MAX_COEFFICIENT, Math.max(MIN_COEFFICIENT, Number(raw.toFixed(4))));
}

async function getActiveSeason(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<ActiveSeason | null> {
  const { data } = await supabase
    .from("majlis_competition_seasons")
    .select("id, goal_points, prize, starts_at, ends_at")
    .eq("is_active", true)
    .maybeSingle();
  return data ?? null;
}

async function getMemberCountAtEvent(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  majlisId: string
): Promise<number> {
  const { count } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("role", "tifl")
    .eq("majlis_id", majlisId)
    .is("deleted_at", null);
  return count ?? 0;
}

async function getAverageActiveMemberCount(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data } = await supabase
    .from("users")
    .select("majlis_id")
    .eq("role", "tifl")
    .is("deleted_at", null)
    .not("majlis_id", "is", null);

  const countsByMajlis = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.majlis_id) continue;
    countsByMajlis.set(row.majlis_id, (countsByMajlis.get(row.majlis_id) ?? 0) + 1);
  }
  const values = [...countsByMajlis.values()];
  if (!values.length) return 0;
  const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
  return avg;
}

async function getCoefficientForMajlis(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  seasonId: string,
  majlisId: string
): Promise<CoefficientRow> {
  const { data: majlisRow } = await supabase.from("majlis").select("name").eq("id", majlisId).maybeSingle();
  if (majlisRow?.name === "Unassigned") {
    return { member_count_snapshot: 0, coefficient: 0 };
  }

  const { data: existing } = await supabase
    .from("majlis_competition_coefficients")
    .select("member_count_snapshot, coefficient")
    .eq("season_id", seasonId)
    .eq("majlis_id", majlisId)
    .maybeSingle();

  if (existing) {
    return {
      member_count_snapshot: existing.member_count_snapshot ?? 0,
      coefficient: Number(existing.coefficient ?? 0),
    };
  }

  const memberCount = await getMemberCountAtEvent(supabase, majlisId);
  const avgCount = await getAverageActiveMemberCount(supabase);
  const coeff = computeCoefficientFromCounts(memberCount, avgCount);

  await supabase.from("majlis_competition_coefficients").upsert(
    {
      season_id: seasonId,
      majlis_id: majlisId,
      member_count_snapshot: memberCount,
      coefficient: coeff,
    },
    { onConflict: "season_id,majlis_id" }
  );

  return { member_count_snapshot: memberCount, coefficient: coeff };
}

export async function recordMajlisCompetitionContribution(input: {
  userId: string;
  majlisId: string | null;
  rawPoints: number;
  homeworkPoints: number;
  eventType: ContributionEventType;
  eventAt?: string;
}) {
  if (!input.majlisId) return { skipped: true as const, reason: "missing_majlis" as const };
  const supabase = createSupabaseServerClient();
  const { data: majlisRow } = await supabase.from("majlis").select("name").eq("id", input.majlisId).maybeSingle();
  if (majlisRow?.name === "Unassigned") {
    return { skipped: true as const, reason: "excluded_unassigned" as const };
  }
  const season = await getActiveSeason(supabase);
  if (!season) return { skipped: true as const, reason: "no_active_season" as const };

  const coeffRow = await getCoefficientForMajlis(supabase, season.id, input.majlisId);
  const raw = Math.max(0, Number(input.rawPoints || 0));
  const hw = Math.max(0, Number(input.homeworkPoints || 0));
  const weighted = (0.5 * raw) + (0.5 * hw);
  const normalized = weighted * Number(coeffRow.coefficient || 0);

  await supabase.from("majlis_competition_ledger").insert({
    season_id: season.id,
    user_id: input.userId,
    majlis_id: input.majlisId,
    event_type: input.eventType,
    raw_points: raw,
    homework_points: hw,
    weighted_points: weighted,
    coefficient_used: coeffRow.coefficient,
    member_count_snapshot: coeffRow.member_count_snapshot,
    normalized_points: Number(normalized.toFixed(2)),
    event_at: input.eventAt ?? new Date().toISOString(),
  });

  return { skipped: false as const };
}

export async function getMajlisCompetitionProgress() {
  const supabase = createSupabaseServerClient();
  const { data: season } = await supabase
    .from("majlis_competition_seasons")
    .select("id, goal_points, prize, starts_at, ends_at")
    .eq("is_active", true)
    .maybeSingle();

  if (!season) return { season: null, progressRows: [], feedRows: [] };

  const [{ data: progressRows }, { data: feedRows }] = await Promise.all([
    supabase
      .from("majlis_competition_progress_current")
      .select("majlis_id, majlis_name, season_id, goal_points, prize, normalized_points, progress_pct")
      .order("normalized_points", { ascending: false }),
    supabase
      .from("majlis_competition_ledger")
      .select("id, user_id, majlis_id, event_type, raw_points, homework_points, normalized_points, event_at, users(name), majlis(name)")
      .eq("season_id", season.id)
      .order("event_at", { ascending: false })
      .limit(80),
  ]);

  const getRelationName = (relation: unknown): string | undefined => {
    if (Array.isArray(relation)) {
      const first = relation[0] as { name?: string } | undefined;
      return first?.name;
    }
    return (relation as { name?: string } | null | undefined)?.name;
  };

  return {
    season,
    progressRows: (progressRows ?? []).filter((row) => row.majlis_name !== "Unassigned"),
    feedRows: (feedRows ?? []).filter((row) => getRelationName((row as { majlis?: unknown }).majlis) !== "Unassigned"),
  };
}
