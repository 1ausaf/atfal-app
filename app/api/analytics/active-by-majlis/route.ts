import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Regional Nazim only" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");
  const date = dateParam ?? new Date().toISOString().slice(0, 10);

  const supabase = createSupabaseServerClient();
  const { data: majlisList } = await supabase.from("majlis").select("id, name").order("name");
  const { data: activityRows } = await supabase
    .from("activity_log")
    .select("user_id")
    .eq("activity_date", date);
  const activeUserIds = new Set((activityRows ?? []).map((r) => r.user_id));
  const { data: users } = await supabase
    .from("users")
    .select("id, majlis_id")
    .eq("role", "tifl")
    .in("id", [...activeUserIds]);
  const countByMajlis = new Map<string, number>();
  (majlisList ?? []).forEach((m) => countByMajlis.set(m.id, 0));
  (users ?? []).forEach((u) => {
    if (u.majlis_id) countByMajlis.set(u.majlis_id, (countByMajlis.get(u.majlis_id) ?? 0) + 1);
  });
  const result = (majlisList ?? []).map((m) => ({
    majlis_id: m.id,
    majlis_name: m.name,
    active_count: countByMajlis.get(m.id) ?? 0,
  }));
  return NextResponse.json({ date, by_majlis: result });
}
