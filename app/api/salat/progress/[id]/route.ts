import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

const TOTAL_CATEGORIES = 14;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (role !== "local_nazim" && role !== "regional_nazim")
    return NextResponse.json({ error: "Only Nazims can mark pass/fail" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const status = body.status;
  if (status !== "passed" && status !== "failed")
    return NextResponse.json({ error: "status must be passed or failed" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: row, error: fetchError } = await supabase
    .from("salat_progress")
    .select("id, user_id")
    .eq("id", id)
    .single();

  if (fetchError || !row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (role === "local_nazim" && session.user.majlisId) {
    const { data: targetUser } = await supabase
      .from("users")
      .select("majlis_id")
      .eq("id", row.user_id)
      .single();
    if (targetUser?.majlis_id !== session.user.majlisId)
      return NextResponse.json({ error: "Not in your Majlis" }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("salat_progress")
    .update({
      status,
      tested_at: new Date().toISOString(),
      tested_by: session.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (status === "passed") {
    const { count } = await supabase
      .from("salat_progress")
      .select("id", { count: "exact", head: true })
      .eq("user_id", row.user_id)
      .eq("status", "passed");
    if (count === TOTAL_CATEGORIES) {
      await supabase.from("users").update({ salat_superstar: true }).eq("id", row.user_id);
    }
  }

  return NextResponse.json({ ok: true });
}
