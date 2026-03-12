import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { habit_id, date } = body;
  if (!habit_id || !date) {
    return NextResponse.json({ error: "Missing habit_id or date" }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("habit_completions")
    .upsert(
      {
        user_id: session.user.id,
        habit_id,
        date,
      },
      { onConflict: "user_id,habit_id,date" }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: habitDef } = await supabase.from("habit_definitions").select("slug").eq("id", habit_id).single();
  const slug = habitDef?.slug;
  const { data: comps } = await supabase
    .from("habit_completions")
    .select("date")
    .eq("user_id", session.user.id)
    .eq("habit_id", habit_id)
    .order("date", { ascending: false });
  const sorted = (comps ?? []).map((c) => c.date);
  let streak = 0;
  let expect = date;
  for (const d of sorted) {
    if (d !== expect) break;
    streak++;
    const next = new Date(d + "T12:00:00");
    next.setDate(next.getDate() - 1);
    expect = next.toISOString().slice(0, 10);
  }
  const achievementBySlug: Record<string, string> = {
    fajr_prayer: "fajr_champion",
    quran_reading: "quran_lover",
    helping_parents: "helping_hero",
    telling_truth: "truthful_muslim",
  };
  const achievementSlug = slug ? achievementBySlug[slug] : null;
  if (achievementSlug && streak >= 7) {
    const { data: ach } = await supabase.from("achievements").select("id").eq("slug", achievementSlug).single();
    if (ach) {
      await supabase.from("user_achievements").upsert(
        { user_id: session.user.id, achievement_id: ach.id },
        { onConflict: "user_id,achievement_id" }
      );
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const habit_id = searchParams.get("habit_id");
  const date = searchParams.get("date");
  if (!habit_id || !date) {
    return NextResponse.json({ error: "Missing habit_id or date" }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("habit_completions")
    .delete()
    .eq("user_id", session.user.id)
    .eq("habit_id", habit_id)
    .eq("date", date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
