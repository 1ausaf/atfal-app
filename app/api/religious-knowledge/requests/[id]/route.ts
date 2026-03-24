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
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const status = body.status;
  if (status !== "passed" && status !== "failed") {
    return NextResponse.json({ error: "Status must be passed or failed" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data: row } = await supabase
    .from("religious_knowledge_test_requests")
    .select("id, user_id")
    .eq("id", id)
    .single();
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "local_nazim" && session.user.majlisId) {
    const { data: tifl } = await supabase.from("users").select("majlis_id").eq("id", row.user_id).single();
    if ((tifl as { majlis_id?: string } | null)?.majlis_id !== session.user.majlisId) {
      return NextResponse.json({ error: "You can only mark tests for your Majlis" }, { status: 403 });
    }
  }

  const { error } = await supabase
    .from("religious_knowledge_test_requests")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: session.user.id,
      notes: typeof body.notes === "string" ? body.notes.trim() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
