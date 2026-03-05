import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

const TOTAL_CATEGORIES = 14;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (role !== "regional_nazim" && role !== "admin")
    return NextResponse.json({ error: "Only Regional Nazim can mark Salat pass/fail" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { passed_arabic, passed_translation, status: legacyStatus } = body;

  const supabase = createSupabaseServerClient();
  const { data: row, error: fetchError } = await supabase
    .from("salat_progress")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof passed_arabic === "boolean") {
    updates.passed_arabic = passed_arabic;
    updates.status = passed_arabic ? "passed" : "failed";
    updates.tested_at = new Date().toISOString();
    updates.tested_by = session.user.id;
  }
  if (typeof passed_translation === "boolean") {
    updates.passed_translation = passed_translation;
    if (!updates.tested_at) {
      updates.tested_at = new Date().toISOString();
      updates.tested_by = session.user.id;
    }
  }

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: "Provide passed_arabic and/or passed_translation (boolean)" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("salat_progress")
    .update(updates)
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { data: allProgress } = await supabase
    .from("salat_progress")
    .select("passed_arabic, passed_translation")
    .eq("user_id", row.user_id);

  const list = allProgress ?? [];
  const allArabic = list.length === TOTAL_CATEGORIES && list.every((p) => p.passed_arabic === true);
  const allTranslation = list.length === TOTAL_CATEGORIES && list.every((p) => p.passed_translation === true);

  await supabase
    .from("users")
    .update({ salat_star: allArabic, salat_superstar: allArabic && allTranslation })
    .eq("id", row.user_id);

  return NextResponse.json({ ok: true });
}
