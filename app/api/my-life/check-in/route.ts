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
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Missing date" }, { status: 400 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("daily_check_ins")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("date", date)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const {
    date,
    mood,
    prayed_today,
    read_quran_today,
    helped_someone_today,
    learned_something_today,
    one_good_thing,
  } = body;
  if (!date || typeof date !== "string") {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }
  const validMoods = ["great", "good", "okay", "bad"];
  if (!validMoods.includes(mood)) {
    return NextResponse.json({ error: "Invalid mood" }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("daily_check_ins")
    .upsert(
      {
        user_id: session.user.id,
        date,
        mood,
        prayed_today: Boolean(prayed_today),
        read_quran_today: Boolean(read_quran_today),
        helped_someone_today: Boolean(helped_someone_today),
        learned_something_today: Boolean(learned_something_today),
        one_good_thing: one_good_thing ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
