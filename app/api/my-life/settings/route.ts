import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("my_life_settings")
    .select("*")
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? { user_id: session.user.id, onboarding_completed_at: null });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { onboarding_completed_at } = body;
  const supabase = createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("my_life_settings")
    .select("user_id")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("my_life_settings")
      .update({
        onboarding_completed_at: onboarding_completed_at === true ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    const { data, error } = await supabase
      .from("my_life_settings")
      .insert({
        user_id: session.user.id,
        onboarding_completed_at: onboarding_completed_at === true ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
}
