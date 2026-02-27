import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl") return NextResponse.json({ error: "Only Tifls can submit homework" }, { status: 403 });
  if (!session.user.majlisId) return NextResponse.json({ error: "Complete your profile to submit homework" }, { status: 403 });

  const body = await request.json();
  const homework_id = body.homework_id;
  if (!homework_id) return NextResponse.json({ error: "homework_id required" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: hw } = await supabase.from("homework").select("id, majlis_id").eq("id", homework_id).single();
  if (!hw) return NextResponse.json({ error: "Homework not found" }, { status: 404 });
  if (hw.majlis_id != null && hw.majlis_id !== session.user.majlisId)
    return NextResponse.json({ error: "You can only submit homework for your Majlis or region-wide homework" }, { status: 403 });

  const { data, error } = await supabase
    .from("homework_submissions")
    .insert({ homework_id, user_id: session.user.id, status: "pending" })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ message: "Already submitted" });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? { ok: true });
}
