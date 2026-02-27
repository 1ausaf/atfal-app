import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

function canEditEvent(
  role: string,
  userMajlisId: string | null,
  eventMajlisId: string | null
): boolean {
  if (role !== "local_nazim" && role !== "regional_nazim") return false;
  if (role === "regional_nazim") return true;
  return userMajlisId != null && eventMajlisId === userMajlisId;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  let query = supabase.from("events").select("*").eq("id", id);
  if (session.user.role === "tifl" && session.user.majlisId) {
    query = query.or(
      `event_type.eq.regional,event_type.eq.national,majlis_id.eq.${session.user.majlisId}`
    );
  }
  if (session.user.role === "local_nazim" && session.user.majlisId) {
    query = query.eq("majlis_id", session.user.majlisId);
  }
  const { data, error } = await query.single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from("events").select("id, majlis_id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditEvent(session.user.role, session.user.majlisId ?? null, existing.majlis_id))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { title, description, location, link, event_type, majlis_id, event_date } = body;
  if (!title || !event_date) return NextResponse.json({ error: "Title and event_date required" }, { status: 400 });
  const allowedTypes = ["regional", "local", "national"];
  if (!allowedTypes.includes(event_type)) return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
  if (session.user.role === "local_nazim" && event_type !== "local")
    return NextResponse.json({ error: "Local Nazim can only have local events" }, { status: 403 });
  const majlisId = event_type === "local" ? (majlis_id ?? session.user.majlisId) : null;
  if (event_type === "local" && !majlisId) return NextResponse.json({ error: "Majlis required for local events" }, { status: 400 });

  const { error: updateError } = await supabase
    .from("events")
    .update({
      title: String(title).trim(),
      description: description != null ? String(description).trim() : null,
      location: location != null ? String(location).trim() : null,
      link: link != null ? String(link).trim() : null,
      event_type,
      majlis_id: majlisId,
      event_date: new Date(event_date).toISOString(),
    })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase.from("events").select("id, majlis_id").eq("id", id).single();
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEditEvent(session.user.role, session.user.majlisId ?? null, existing.majlis_id))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
