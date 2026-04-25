import { createSupabaseServerClient } from "@/lib/supabase";
import { getMajlisCompetitionProgress } from "@/lib/majlis-competition";

export type FrozenMajlisRow = {
  majlis_id: string;
  majlis_name: string;
  normalized_points: number;
  progress_pct: number;
};

export type FrozenMajlisData = {
  goalPoints: number;
  prize: string;
  rows: FrozenMajlisRow[];
};

export async function getSeasonOverMajlisStandings(): Promise<FrozenMajlisData | null> {
  const progress = await getMajlisCompetitionProgress();
  if (progress.season && progress.progressRows.length > 0) {
    const goalPoints = Number(progress.season.goal_points ?? 0);
    const prize = progress.season.prize ?? "Majlis Pizza Party";
    const rows: FrozenMajlisRow[] = [...progress.progressRows]
      .map((r) => ({
        majlis_id: r.majlis_id as string,
        majlis_name: (r as { majlis_name: string }).majlis_name,
        normalized_points: Number((r as { normalized_points: number }).normalized_points ?? 0),
        progress_pct: Number((r as { progress_pct: number }).progress_pct ?? 0),
      }))
      .sort((a, b) => b.normalized_points - a.normalized_points);
    return { goalPoints, prize, rows };
  }

  const supabase = createSupabaseServerClient();
  const { data: seasons } = await supabase
    .from("majlis_competition_seasons")
    .select("id, goal_points, prize, ends_at, is_active")
    .order("ends_at", { ascending: false });

  const ended = (seasons ?? []).filter((s) => !s.is_active).sort((a, b) => new Date(b.ends_at).getTime() - new Date(a.ends_at).getTime());
  const season = ended[0];
  if (!season) {
    const active = (seasons ?? []).find((s) => s.is_active);
    if (!active) return null;
    return {
      goalPoints: Number(active.goal_points ?? 0),
      prize: active.prize ?? "Majlis Pizza Party",
      rows: [],
    };
  }

  const { data: ledger } = await supabase
    .from("majlis_competition_ledger")
    .select("majlis_id, normalized_points")
    .eq("season_id", season.id);

  const byMajlis = new Map<string, number>();
  for (const row of ledger ?? []) {
    if (!row.majlis_id) continue;
    byMajlis.set(row.majlis_id, (byMajlis.get(row.majlis_id) ?? 0) + Number(row.normalized_points ?? 0));
  }

  const { data: majlisRows } = await supabase.from("majlis").select("id, name");
  const goalPoints = Number(season.goal_points ?? 0);
  const prize = season.prize ?? "Majlis Pizza Party";

  const rows: FrozenMajlisRow[] = (majlisRows ?? [])
    .filter((m) => m.name !== "Unassigned")
    .map((m) => {
      const normalized_points = byMajlis.get(m.id) ?? 0;
      const progress_pct =
        goalPoints <= 0 ? 0 : Math.min(100, Math.round((normalized_points / goalPoints) * 10000) / 100);
      return {
        majlis_id: m.id,
        majlis_name: m.name ?? "—",
        normalized_points,
        progress_pct,
      };
    })
    .sort((a, b) => b.normalized_points - a.normalized_points);

  return { goalPoints, prize, rows };
}
