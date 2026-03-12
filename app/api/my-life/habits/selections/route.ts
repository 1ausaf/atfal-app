import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { habit_definition_ids } = body;
  if (!Array.isArray(habit_definition_ids) || habit_definition_ids.length > 5) {
    return NextResponse.json(
      { error: "habit_definition_ids must be an array with at most 5 UUIDs" },
      { status: 400 }
    );
  }
  const ids = habit_definition_ids.slice(0, 5).filter((id: unknown) => typeof id === "string");
  const supabase = createSupabaseServerClient();

  const { data: defs } = await supabase
    .from("habit_definitions")
    .select("id, is_mandatory")
    .in("id", ids);
  const validDefs = (defs ?? []).filter((d) => !d.is_mandatory);
  if (validDefs.length !== ids.length) {
    return NextResponse.json(
      { error: "All selected habits must be optional (non-mandatory)" },
      { status: 400 }
    );
  }
  const validIds = validDefs.map((d) => d.id);

  await supabase.from("tifl_habit_selections").delete().eq("user_id", session.user.id);
  if (validIds.length > 0) {
    const rows = validIds.map((habit_definition_id) => ({
      user_id: session.user.id,
      habit_definition_id,
    }));
    const { error } = await supabase.from("tifl_habit_selections").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
