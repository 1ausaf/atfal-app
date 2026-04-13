import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createSupabaseServerClient();
  const { data: latest, error: latestErr } = await supabase
    .from("tifl_announcements")
    .select("id, title, body")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestErr) return NextResponse.json({ error: latestErr.message }, { status: 500 });
  if (!latest) return NextResponse.json({ announcement: null });

  const { data: dismissal } = await supabase
    .from("tifl_announcement_dismissals")
    .select("user_id")
    .eq("user_id", session.user.id)
    .eq("announcement_id", latest.id)
    .maybeSingle();

  if (dismissal) return NextResponse.json({ announcement: null });
  return NextResponse.json({
    announcement: {
      id: latest.id,
      title: latest.title,
      body: latest.body,
    },
  });
}
