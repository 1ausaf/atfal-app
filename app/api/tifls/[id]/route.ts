import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "local_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { majlis_id, deleted, name, date_of_birth, manual_points } = body;
  const supabase = createSupabaseServerClient();
  const { data: user } = await supabase.from("users").select("id, role, majlis_id").eq("id", id).single();
  if (!user || user.role !== "tifl") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isLocalNazim = session.user.role === "local_nazim";
  if (isLocalNazim) {
    if (user.majlis_id !== session.user.majlisId)
      return NextResponse.json({ error: "You can only edit Tifls in your Majlis" }, { status: 403 });
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name ? String(name).trim() : null;
    if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth ? String(date_of_birth).trim() : null;
    if (manual_points !== undefined) updates.manual_points = Math.max(0, Math.floor(Number(manual_points)));
    const { error } = await supabase.from("users").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (majlis_id !== undefined) updates.majlis_id = majlis_id || null;
  if (deleted === true) updates.deleted_at = new Date().toISOString();
  if (deleted === false) updates.deleted_at = null;
  if (manual_points !== undefined) updates.manual_points = Math.max(0, Math.floor(Number(manual_points)));
  const { error } = await supabase.from("users").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
