import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json(
      { error: "Regional Nazim or Admin only" },
      { status: 403 }
    );

  const supabase = createSupabaseServerClient();
  const { data: activities } = await supabase
    .from("lesson_activities")
    .select("id, title")
    .order("title", { ascending: true });
  const { data: tiflUsers } = await supabase
    .from("users")
    .select("id")
    .eq("role", "tifl");
  const tiflIds = new Set((tiflUsers ?? []).map((u) => u.id));
  const { data: submissions } = await supabase
    .from("lesson_submissions")
    .select("activity_id, user_id");
  const countByActivity = new Map<string, number>();
  (activities ?? []).forEach((a) => countByActivity.set(a.id, 0));
  (submissions ?? []).forEach((s) => {
    if (tiflIds.has(s.user_id))
      countByActivity.set(
        s.activity_id,
        (countByActivity.get(s.activity_id) ?? 0) + 1
      );
  });
  const result = (activities ?? []).map((a) => ({
    activity_id: a.id,
    title: a.title,
    completion_count: countByActivity.get(a.id) ?? 0,
  }));
  return NextResponse.json({ activities: result });
}
