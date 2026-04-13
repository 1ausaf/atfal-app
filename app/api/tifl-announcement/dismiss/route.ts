import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const announcementId =
    typeof body === "object" && body !== null && "announcement_id" in body
      ? String((body as { announcement_id: unknown }).announcement_id ?? "")
      : "";

  if (!announcementId || !UUID_RE.test(announcementId))
    return NextResponse.json({ error: "announcement_id must be a valid UUID" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: latest } = await supabase
    .from("tifl_announcements")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest || latest.id !== announcementId)
    return NextResponse.json({ error: "Announcement is no longer current" }, { status: 400 });

  const { error } = await supabase.from("tifl_announcement_dismissals").upsert(
    {
      user_id: session.user.id,
      announcement_id: announcementId,
      dismissed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,announcement_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
