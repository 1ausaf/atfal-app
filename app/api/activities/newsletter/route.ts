import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("activity_newsletter")
    .select("id, title, document_url, cover_url, order, created_at, majlis_id")
    .order("order", { ascending: true })
    .order("created_at", { ascending: false });
  const role = session.user.role;
  const userMajlisId = session.user.majlisId ?? null;
  if (role === "tifl") {
    if (userMajlisId) query = query.or(`majlis_id.eq.${userMajlisId},majlis_id.is.null`);
    else query = query.is("majlis_id", null);
  } else if (role === "local_nazim") {
    if (userMajlisId) query = query.or(`majlis_id.eq.${userMajlisId},majlis_id.is.null`);
    else query = query.is("majlis_id", null);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (role !== "regional_nazim" && role !== "local_nazim" && role !== "admin")
    return NextResponse.json({ error: "Only Regional or Local Nazim can add newsletter documents" }, { status: 403 });
  const body = await request.json();
  const { title, document_url, cover_url, order } = body;
  if (!title || !document_url) return NextResponse.json({ error: "Title and document_url required" }, { status: 400 });
  if (!isValidUrl(document_url)) return NextResponse.json({ error: "Invalid document_url" }, { status: 400 });
  if (cover_url != null && cover_url !== "" && !isValidUrl(cover_url))
    return NextResponse.json({ error: "Invalid cover_url" }, { status: 400 });
  const supabase = createSupabaseServerClient();
  let majlis_id: string | null;
  if (role === "local_nazim") {
    if (!session.user.majlisId) return NextResponse.json({ error: "Local Nazim must have a majlis" }, { status: 400 });
    majlis_id = session.user.majlisId;
  } else {
    majlis_id = null;
  }
  const { data, error } = await supabase
    .from("activity_newsletter")
    .insert({
      title: String(title).trim(),
      document_url: String(document_url).trim(),
      cover_url: cover_url ? String(cover_url).trim() : null,
      order: typeof order === "number" ? order : 0,
      created_by: session.user.id,
      majlis_id,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
