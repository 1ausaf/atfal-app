import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

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

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("lesson_activities")
    .select("id, title, description, link, type, thumbnail_url, section_id, target_age_groups, created_at")
    .order("created_at", { ascending: false });
  if (session.user.role === "tifl") {
    const { data: profile } = await supabase
      .from("users")
      .select("age_group")
      .eq("id", session.user.id)
      .maybeSingle();
    const tiflAgeGroup = profile?.age_group;
    if (!tiflAgeGroup) return NextResponse.json({ error: "No age group assigned" }, { status: 403 });
    query = query.or(
      `target_age_groups.cs.{"all"},target_age_groups.cs.{"${tiflAgeGroup}"},target_age_groups.is.null`
    );
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Only Nazim/Admin can create lessons" }, { status: 403 });
  const body = await request.json();
  const { title, description, link, type, thumbnail_url, section_id, target_age_groups } = body;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const normalizedTargetAgeGroups = normalizeTargetAgeGroups(target_age_groups);
  const supabase = createSupabaseServerClient();
  let sectionIdValue: string | null = null;
  if (section_id != null && section_id !== "") {
    const { data: sectionRow } = await supabase
      .from("lesson_sections")
      .select("id")
      .eq("id", String(section_id))
      .single();
    if (!sectionRow) {
      return NextResponse.json({ error: "Invalid section_id" }, { status: 400 });
    }
    sectionIdValue = sectionRow.id;
  }
  const { data, error } = await supabase
    .from("lesson_activities")
    .insert({
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      link: link ? String(link).trim() : null,
      type: type === "article" ? "article" : "video",
      thumbnail_url: thumbnail_url != null && thumbnail_url !== "" ? String(thumbnail_url).trim() : null,
      created_by: session.user.id,
      section_id: sectionIdValue,
      target_age_groups: normalizedTargetAgeGroups,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
