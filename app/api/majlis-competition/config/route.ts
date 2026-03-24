import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { computeCoefficientFromCounts } from "@/lib/majlis-competition";

function isRegionalOrAdmin(role: string) {
  return role === "regional_nazim" || role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isRegionalOrAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createSupabaseServerClient();
  const [{ data: season }, { data: majlis }] = await Promise.all([
    supabase
      .from("majlis_competition_seasons")
      .select("id, name, goal_points, prize, starts_at, ends_at, is_active")
      .eq("is_active", true)
      .maybeSingle(),
    supabase.from("majlis").select("id, name").neq("name", "Unassigned").order("name", { ascending: true }),
  ]);

  let coeffRows: Array<{ majlis_id: string; member_count_snapshot: number; coefficient: number }> = [];
  if (season?.id) {
    const { data } = await supabase
      .from("majlis_competition_coefficients")
      .select("majlis_id, member_count_snapshot, coefficient")
      .eq("season_id", season.id);
    coeffRows = (data ?? []).map((row) => ({
      majlis_id: row.majlis_id,
      member_count_snapshot: row.member_count_snapshot ?? 0,
      coefficient: Number(row.coefficient ?? 0),
    }));
  }

  return NextResponse.json({
    season: season ?? null,
    majlis: majlis ?? [],
    coefficients: coeffRows,
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isRegionalOrAdmin(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const {
    name,
    goal_points,
    prize,
    starts_at,
    ends_at,
    is_active = true,
    member_counts,
  } = body as {
    name?: string;
    goal_points?: number;
    prize?: string;
    starts_at?: string;
    ends_at?: string;
    is_active?: boolean;
    member_counts?: Record<string, number>;
  };

  if (!name || !starts_at || !ends_at) {
    return NextResponse.json({ error: "name, starts_at, and ends_at are required" }, { status: 400 });
  }
  const goalPoints = Math.max(0, Number(goal_points || 0));
  if (!goalPoints) {
    return NextResponse.json({ error: "goal_points must be greater than 0" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  if (is_active) {
    await supabase.from("majlis_competition_seasons").update({ is_active: false }).eq("is_active", true);
  }

  const { data: season, error: seasonError } = await supabase
    .from("majlis_competition_seasons")
    .insert({
      name: String(name).trim(),
      goal_points: goalPoints,
      prize: prize?.trim() || "Majlis Pizza Party",
      starts_at: new Date(starts_at).toISOString(),
      ends_at: new Date(ends_at).toISOString(),
      is_active: Boolean(is_active),
      created_by: session.user.id,
    })
    .select("id")
    .single();

  if (seasonError || !season) return NextResponse.json({ error: seasonError?.message ?? "Failed to create season" }, { status: 500 });

  const countsInput = member_counts ?? {};
  const positiveCounts = Object.values(countsInput).filter((n) => Number(n) > 0).map((n) => Number(n));
  const averageCount = positiveCounts.length
    ? positiveCounts.reduce((sum, n) => sum + n, 0) / positiveCounts.length
    : 0;

  const coefficientRows = Object.entries(countsInput).map(([majlisId, count]) => {
    const memberCount = Math.max(0, Number(count || 0));
    return {
      season_id: season.id,
      majlis_id: majlisId,
      member_count_snapshot: memberCount,
      coefficient: computeCoefficientFromCounts(memberCount, averageCount),
    };
  });

  if (coefficientRows.length) {
    const { error: coeffError } = await supabase
      .from("majlis_competition_coefficients")
      .upsert(coefficientRows, { onConflict: "season_id,majlis_id" });
    if (coeffError) return NextResponse.json({ error: coeffError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, season_id: season.id });
}
