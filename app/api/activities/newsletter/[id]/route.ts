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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("activity_newsletter")
    .select("id, title, document_url, cover_url, order, created_at, majlis_id")
    .eq("id", id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const role = session.user.role;
  const userMajlisId = session.user.majlisId ?? null;
  if (role === "tifl") {
    if (data.majlis_id && data.majlis_id !== userMajlisId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else if (role === "local_nazim") {
    if (data.majlis_id != null && data.majlis_id !== userMajlisId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Only Regional Nazim can edit newsletter documents" }, { status: 403 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { data: existing, error: fetchError } = await supabase
    .from("activity_newsletter")
    .select("id")
    .eq("id", id)
    .single();
  if (fetchError || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { title, document_url, cover_url, order } = body;
  const updates: { title?: string; document_url?: string; cover_url?: string | null; order?: number } = {};
  if (title !== undefined) updates.title = String(title).trim();
  if (document_url !== undefined) {
    if (!document_url || !isValidUrl(document_url))
      return NextResponse.json({ error: "Invalid document_url" }, { status: 400 });
    updates.document_url = String(document_url).trim();
  }
  if (cover_url !== undefined) {
    updates.cover_url = cover_url === null || cover_url === "" ? null : String(cover_url).trim();
    if (updates.cover_url && !isValidUrl(updates.cover_url))
      return NextResponse.json({ error: "Invalid cover_url" }, { status: 400 });
  }
  if (order !== undefined) updates.order = typeof order === "number" ? order : 0;

  const { data, error } = await supabase
    .from("activity_newsletter")
    .update(updates)
    .eq("id", id)
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Only Regional Nazim can delete newsletter documents" }, { status: 403 });
  const { id } = await params;
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("activity_newsletter").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
