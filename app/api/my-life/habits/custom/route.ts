import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "tifl") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { label } = body;
  if (!label || typeof label !== "string" || !label.trim()) {
    return NextResponse.json({ error: "Missing or invalid label" }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();
  const slug = `custom_${randomUUID()}`;
  const { data, error } = await supabase
    .from("habit_definitions")
    .insert({
      slug,
      label: label.trim(),
      user_id: session.user.id,
      is_mandatory: false,
      sort_order: 100,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
