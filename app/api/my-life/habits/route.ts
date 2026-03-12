import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const optionalOnly = searchParams.get("optional_only") === "true";
  const supabase = createSupabaseServerClient();

  if (optionalOnly) {
    const { data } = await supabase
      .from("habit_definitions")
      .select("*")
      .eq("is_mandatory", false)
      .is("user_id", null)
      .order("sort_order");
    return NextResponse.json({
      definitions: data ?? [],
      completions: [] as { habitId: string; date: string }[],
    });
  }

  const [mandatoryRes, selectionsRes, goalHabitsRes, customRes, compRes] = await Promise.all([
    supabase.from("habit_definitions").select("*").eq("is_mandatory", true).order("sort_order"),
    supabase
      .from("tifl_habit_selections")
      .select("habit_definition_id")
      .eq("user_id", session.user.id),
    supabase
      .from("goals")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("status", "active"),
    supabase
      .from("habit_definitions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("sort_order"),
    fromDate && toDate
      ? supabase
          .from("habit_completions")
          .select("habit_id, date")
          .eq("user_id", session.user.id)
          .gte("date", fromDate)
          .lte("date", toDate)
      : Promise.resolve({ data: [] as { habit_id: string; date: string }[] }),
  ]);
  const mandatory = mandatoryRes.data ?? [];
  const selectedIds = (selectionsRes.data ?? []).map((r) => r.habit_definition_id);
  const activeGoalIds = (goalHabitsRes.data ?? []).map((g: { id: string }) => g.id);
  const customDefs = customRes.data ?? [];
  const completions = compRes.data ?? [];

  let goalHabitIds: string[] = [];
  if (activeGoalIds.length > 0) {
    const { data: gh } = await supabase
      .from("goal_habits")
      .select("habit_definition_id")
      .in("goal_id", activeGoalIds);
    goalHabitIds = [...new Set((gh ?? []).map((r: { habit_definition_id: string }) => r.habit_definition_id))];
  }

  const customIds = new Set(customDefs.map((d) => d.id));
  let optionalDefs: { id: string; slug: string; label: string; icon_name: string | null; sort_order: number; is_mandatory?: boolean; user_id?: string }[] = [];
  const allOptionalIds = [...new Set([...selectedIds, ...goalHabitIds])].filter((id) => !customIds.has(id));
  if (allOptionalIds.length > 0) {
    const { data } = await supabase
      .from("habit_definitions")
      .select("*")
      .in("id", allOptionalIds)
      .order("sort_order");
    optionalDefs = (data ?? []).filter((d) => !d.is_mandatory);
  }
  const definitions = [...mandatory, ...optionalDefs, ...customDefs];
  definitions.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return NextResponse.json({
    definitions,
    completions: completions.map((c) => ({ habitId: c.habit_id, date: c.date })),
  });
}
