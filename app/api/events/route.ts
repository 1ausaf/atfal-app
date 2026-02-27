import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("events")
    .select("id, title, description, location, link, event_type, majlis_id, event_date, created_at")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(limit);
  if (session.user.role === "tifl" && session.user.majlisId) {
    query = query.or(
      `event_type.eq.regional,event_type.eq.national,majlis_id.eq.${session.user.majlisId}`
    );
  }
  if (session.user.role === "local_nazim" && session.user.majlisId) {
    query = query.eq("majlis_id", session.user.majlisId);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: majlis } = await supabase.from("majlis").select("id, name");
  const majlisMap = new Map((majlis ?? []).map((m) => [m.id, m.name]));
  const withMajlis = (data ?? []).map((e) => ({
    ...e,
    majlis_name: e.majlis_id ? majlisMap.get(e.majlis_id) : null,
  }));
  return NextResponse.json(withMajlis);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const { title, description, location, link, event_type, majlis_id, event_date } = body;
  if (!title || !event_date) return NextResponse.json({ error: "Title and event_date required" }, { status: 400 });
  const allowedTypes = ["regional", "local", "national"];
  if (!allowedTypes.includes(event_type)) return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
  if (session.user.role === "local_nazim" && event_type !== "local")
    return NextResponse.json({ error: "Local Nazim can only create local events" }, { status: 403 });
  const majlisId = event_type === "local" ? (majlis_id ?? session.user.majlisId) : null;
  if (event_type === "local" && !majlisId) return NextResponse.json({ error: "Majlis required for local events" }, { status: 400 });
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      location: location ? String(location).trim() : null,
      link: link ? String(link).trim() : null,
      event_type,
      majlis_id: majlisId,
      event_date: new Date(event_date).toISOString(),
      created_by: session.user.id,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
