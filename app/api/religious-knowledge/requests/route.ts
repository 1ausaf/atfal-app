import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseServerClient();
  if (session.user.role === "tifl") {
    const { data, error } = await supabase
      .from("religious_knowledge_test_requests")
      .select("id, section_id, status, requested_at, reviewed_at")
      .eq("user_id", session.user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("religious_knowledge_test_requests")
    .select("id, user_id, section_id, status, requested_at, reviewed_at, reviewed_by, users(name, member_code, majlis_id)")
    .in("status", ["ready_for_test", "failed"])
    .order("requested_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const filtered =
    session.user.role === "local_nazim" && session.user.majlisId
      ? (data ?? []).filter((row) => (row.users as { majlis_id?: string } | null)?.majlis_id === session.user.majlisId)
      : (data ?? []);

  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl") return NextResponse.json({ error: "Only Tifls can request tests" }, { status: 403 });

  const body = await request.json();
  const sectionId = typeof body.section_id === "string" ? body.section_id.trim() : "";
  if (!sectionId) return NextResponse.json({ error: "section_id required" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("religious_knowledge_test_requests").upsert(
    {
      user_id: session.user.id,
      section_id: sectionId,
      status: "ready_for_test",
      requested_at: now,
      reviewed_at: null,
      reviewed_by: null,
      updated_at: now,
    },
    { onConflict: "user_id,section_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
