import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const dayOfWeek = searchParams.get("day_of_week");
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("schedule_blocks")
    .select("*")
    .eq("user_id", session.user.id)
    .order("start_time", { nullsFirst: true });
  if (dayOfWeek !== null && dayOfWeek !== undefined && dayOfWeek !== "") {
    const d = parseInt(dayOfWeek, 10);
    if (d >= 0 && d <= 6) query = query.eq("day_of_week", d);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { day_of_week, block_type, label, start_time, end_time } = body;
  if (typeof day_of_week !== "number" || day_of_week < 0 || day_of_week > 6) {
    return NextResponse.json({ error: "Invalid day_of_week" }, { status: 400 });
  }
  const validTypes = [
    "wake_up", "fajr", "school", "homework", "quran_reading",
    "sports", "family_time", "masjid", "free_time", "sleep", "custom",
  ];
  if (!validTypes.includes(block_type)) {
    return NextResponse.json({ error: "Invalid block_type" }, { status: 400 });
  }
  if (block_type === "custom" && (!label || typeof label !== "string" || !label.trim())) {
    return NextResponse.json({ error: "Custom block requires a label" }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("schedule_blocks")
    .insert({
      user_id: session.user.id,
      day_of_week: day_of_week,
      block_type,
      label: block_type === "custom" ? (label as string).trim() : (label ?? null),
      start_time: start_time || null,
      end_time: end_time || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
