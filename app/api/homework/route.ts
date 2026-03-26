import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getStartOfTodayTorontoISO } from "@/lib/datetime";

const VALID_AGE_GROUPS = ["all", "7-9", "10-11", "12-14"] as const;

function normalizeTargetAgeGroups(input: unknown): Array<(typeof VALID_AGE_GROUPS)[number]> {
  if (!Array.isArray(input) || input.length === 0) return ["all"];
  const filtered = input
    .map((value) => String(value))
    .filter((value): value is (typeof VALID_AGE_GROUPS)[number] =>
      (VALID_AGE_GROUPS as readonly string[]).includes(value)
    );
  if (filtered.length === 0) return ["all"];
  if (filtered.includes("all")) return ["all"];
  return [...new Set(filtered)];
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("homework")
    .select("id, majlis_id, title, description, due_by, links, release_at, lesson_activity_id, target_age_groups, created_by, created_at")
    .order("due_by", { ascending: true });
  if (session.user.role === "tifl") {
    if (!session.user.majlisId) return NextResponse.json({ error: "No Majlis" }, { status: 403 });
    const { data: tiflProfile } = await supabase
      .from("users")
      .select("age_group")
      .eq("id", session.user.id)
      .maybeSingle();
    const tiflAgeGroup = tiflProfile?.age_group;
    if (!tiflAgeGroup) return NextResponse.json({ error: "No age group assigned" }, { status: 403 });
    const nowIso = new Date().toISOString();
    query = query
      .or(`majlis_id.eq.${session.user.majlisId},majlis_id.is.null`)
      .or(`release_at.is.null,release_at.lte.${nowIso}`)
      .or(
        `target_age_groups.cs.{"all"},target_age_groups.cs.{"${tiflAgeGroup}"},target_age_groups.is.null`
      );
  } else if (session.user.role === "local_nazim") {
    if (!session.user.majlisId) return NextResponse.json({ error: "No Majlis" }, { status: 403 });
    query = query.eq("majlis_id", session.user.majlisId);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const { title, description, due_by, links, majlis_id, release_at, lesson_activity_id, target_age_groups } = body;
  if (!title || !due_by) return NextResponse.json({ error: "Title and due_by required" }, { status: 400 });
  const normalizedTargetAgeGroups = normalizeTargetAgeGroups(target_age_groups);
  let majlisId: string | null;
  if (session.user.role === "regional_nazim" || session.user.role === "admin") {
    majlisId = majlis_id === undefined ? session.user.majlisId : majlis_id;
    if (majlisId !== null && !majlisId) majlisId = session.user.majlisId;
  } else {
    majlisId = session.user.majlisId;
    if (!majlisId) return NextResponse.json({ error: "Majlis required" }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();
  if (session.user.role === "local_nazim") {
    const todayStartIso = getStartOfTodayTorontoISO();
    const { count, error: dayCountError } = await supabase
      .from("homework")
      .select("*", { count: "exact", head: true })
      .eq("created_by", session.user.id)
      .gte("created_at", todayStartIso);
    if (dayCountError) return NextResponse.json({ error: dayCountError.message }, { status: 500 });
    if ((count ?? 0) >= 5) {
      return NextResponse.json({ error: "Daily homework assignment limit reached (max 5)." }, { status: 400 });
    }
  }
  if (lesson_activity_id) {
    const { data: lesson } = await supabase.from("lesson_activities").select("id").eq("id", lesson_activity_id).single();
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 400 });
  }
  const releaseAt = release_at != null && release_at !== "" ? new Date(release_at).toISOString() : null;
  const { data, error } = await supabase
    .from("homework")
    .insert({
      majlis_id: majlisId,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      due_by: new Date(due_by).toISOString(),
      links: Array.isArray(links) ? links : [],
      release_at: releaseAt,
      lesson_activity_id: lesson_activity_id || null,
      target_age_groups: normalizedTargetAgeGroups,
      created_by: session.user.id,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
