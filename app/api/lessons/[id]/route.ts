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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("lesson_activities").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "tifl") {
    const { data: profile } = await supabase
      .from("users")
      .select("age_group")
      .eq("id", session.user.id)
      .maybeSingle();
    const tiflAgeGroup = profile?.age_group;
    const targetAgeGroups = Array.isArray(data.target_age_groups) ? (data.target_age_groups as string[]) : ["all"];
    if (!(targetAgeGroups.includes("all") || (tiflAgeGroup != null && targetAgeGroups.includes(tiflAgeGroup)))) {
      return NextResponse.json({ error: "This lesson is not assigned to your age group" }, { status: 403 });
    }
  }
  const { data: questions } = await supabase
    .from("lesson_questions")
    .select("*")
    .eq("activity_id", id)
    .order("order", { ascending: true });
  return NextResponse.json({ ...data, questions: questions ?? [] });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Only Regional Nazim can edit lessons" }, { status: 403 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from("lesson_activities").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { title, description, link, type, thumbnail_url, section_id, target_age_groups } = body;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const activityType = type === "article" ? "article" : "video";

  const updates: Record<string, unknown> = {
    title: String(title).trim(),
    description: description != null ? String(description).trim() : null,
    link: link != null ? String(link).trim() : null,
    type: activityType,
  };
  if (thumbnail_url !== undefined)
    updates.thumbnail_url = thumbnail_url != null && thumbnail_url !== "" ? String(thumbnail_url).trim() : null;
  if (target_age_groups !== undefined) updates.target_age_groups = normalizeTargetAgeGroups(target_age_groups);
  if (section_id !== undefined) {
    if (section_id == null || section_id === "") {
      updates.section_id = null;
    } else {
      const { data: sectionRow } = await supabase
        .from("lesson_sections")
        .select("id")
        .eq("id", String(section_id))
        .single();
      if (!sectionRow) {
        return NextResponse.json({ error: "Invalid section_id" }, { status: 400 });
      }
      updates.section_id = sectionRow.id;
    }
  }

  const { error: updateError } = await supabase
    .from("lesson_activities")
    .update(updates)
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Only Regional Nazim can delete lessons" }, { status: 403 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from("lesson_activities").select("id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { error } = await supabase.from("lesson_activities").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
