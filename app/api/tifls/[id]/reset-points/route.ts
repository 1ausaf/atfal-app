import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

/** Zeros all sources that feed `leaderboard.total_points` for one tifl (manual, homework, lessons, login/wordle/crossword activity_log, streak). Removes their majlis competition ledger rows. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "local_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: user } = await supabase.from("users").select("id, role, majlis_id").eq("id", id).single();
  if (!user || user.role !== "tifl") return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "local_nazim") {
    if (user.majlis_id !== session.user.majlisId)
      return NextResponse.json({ error: "You can only reset Tifls in your Majlis" }, { status: 403 });
  }

  const { error: uErr } = await supabase
    .from("users")
    .update({ manual_points: 0, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  const { error: hwErr } = await supabase.from("homework_submissions").update({ points_awarded: 0 }).eq("user_id", id);
  if (hwErr) return NextResponse.json({ error: hwErr.message }, { status: 500 });

  const { error: lsErr } = await supabase.from("lesson_submissions").update({ points_awarded: 0 }).eq("user_id", id);
  if (lsErr) return NextResponse.json({ error: lsErr.message }, { status: 500 });

  const { error: alErr } = await supabase.from("activity_log").update({ points_awarded: 0 }).eq("user_id", id);
  if (alErr) return NextResponse.json({ error: alErr.message }, { status: 500 });

  const { error: stErr } = await supabase
    .from("login_streak")
    .update({ current_streak: 0, last_activity_date: "1900-01-01" })
    .eq("user_id", id);
  if (stErr) return NextResponse.json({ error: stErr.message }, { status: 500 });

  const { error: ledErr } = await supabase.from("majlis_competition_ledger").delete().eq("user_id", id);
  if (ledErr) return NextResponse.json({ error: ledErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
