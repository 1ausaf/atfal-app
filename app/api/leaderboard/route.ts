import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

const VALID_AGE_GROUPS = ["7-9", "10-11", "12-14"] as const;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const ageGroup = searchParams.get("age_group") ?? "7-9";
  if (!VALID_AGE_GROUPS.includes(ageGroup as (typeof VALID_AGE_GROUPS)[number])) {
    return NextResponse.json({ error: "Invalid age_group" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("leaderboard")
    .select("id, name, age, age_group, majlis_id, total_points")
    .eq("age_group", ageGroup)
    .order("total_points", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: majlis } = await supabase.from("majlis").select("id, name");
  const majlisMap = new Map((majlis ?? []).map((m) => [m.id, m.name]));

  return NextResponse.json({
    rows: rows ?? [],
    majlisMap: Object.fromEntries(majlisMap),
  });
}
