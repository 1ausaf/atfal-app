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
  const status = searchParams.get("status");
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("goals")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });
  if (status === "active" || status === "completed") {
    query = query.eq("status", status);
  }
  const { data: goals, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const list = goals ?? [];
  if (list.length === 0) return NextResponse.json(list);

  const goalIds = list.map((g: { id: string }) => g.id);
  const { data: goalHabits } = await supabase
    .from("goal_habits")
    .select("goal_id, habit_definition_id")
    .in("goal_id", goalIds);
  const habitIds = [...new Set((goalHabits ?? []).map((r: { habit_definition_id: string }) => r.habit_definition_id))];
  const { data: defs } = habitIds.length
    ? await supabase.from("habit_definitions").select("id, label").in("id", habitIds)
    : { data: [] };
  const labelById = new Map((defs ?? []).map((d: { id: string; label: string }) => [d.id, d.label]));
  const habitsByGoal = new Map<string, { id: string; label: string }[]>();
  (goalHabits ?? []).forEach((r: { goal_id: string; habit_definition_id: string }) => {
    const arr = habitsByGoal.get(r.goal_id) ?? [];
    const label = labelById.get(r.habit_definition_id);
    if (label) arr.push({ id: r.habit_definition_id, label });
    habitsByGoal.set(r.goal_id, arr);
  });
  const result = list.map((g: { id: string; [k: string]: unknown }) => ({
    ...g,
    habits: habitsByGoal.get(g.id) ?? [],
  }));
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { title, target_type, target_value, due_date, description, habit_definition_ids, new_habit_labels } = body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }
  const validTypes = ["streak_days", "count", "surah", "custom"];
  const targetType = validTypes.includes(body.target_type) ? body.target_type : "custom";
  let dueDateValue: string | null = null;
  if (due_date != null && due_date !== "") {
    if (typeof due_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return NextResponse.json({ error: "Invalid due_date (use YYYY-MM-DD)" }, { status: 400 });
    }
    dueDateValue = due_date;
  }
  const supabase = createSupabaseServerClient();
  const { randomUUID } = await import("crypto");
  const habitIds: string[] = Array.isArray(habit_definition_ids)
    ? habit_definition_ids.filter((id: unknown) => typeof id === "string")
    : [];
  const newLabels: string[] = Array.isArray(new_habit_labels)
    ? new_habit_labels.filter((l: unknown) => typeof l === "string" && String(l).trim())
    : [];
  for (const label of newLabels) {
    const slug = `custom_${randomUUID()}`;
    const { data: created } = await supabase
      .from("habit_definitions")
      .insert({
        slug,
        label: label.trim(),
        user_id: session.user.id,
        is_mandatory: false,
        sort_order: 100,
      })
      .select("id")
      .single();
    if (created?.id) habitIds.push(created.id);
  }
  const descriptionValue =
    description != null && typeof description === "string" ? (description.trim() || null) : null;
  const { data: goal, error } = await supabase
    .from("goals")
    .insert({
      user_id: session.user.id,
      title: title.trim(),
      target_type: targetType,
      target_value: typeof target_value === "number" ? target_value : null,
      current_value: 0,
      status: "active",
      due_date: dueDateValue,
      description: descriptionValue,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (habitIds.length > 0) {
    const rows = habitIds.map((habit_definition_id) => ({
      goal_id: goal.id,
      habit_definition_id,
    }));
    await supabase.from("goal_habits").insert(rows);
  }
  return NextResponse.json({ ...goal, habits: [] });
}
