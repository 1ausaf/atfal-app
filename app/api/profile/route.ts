import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getAgeAndGroup } from "@/lib/mayar";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseServerClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, age, age_group, majlis_id, date_of_birth, salat_superstar")
    .eq("id", session.user.id)
    .single();

  if (error || !user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { date_of_birth, name, majlis_id } = body;

  let age: number | null = null;
  let age_group: string | null = null;
  if (date_of_birth !== undefined) {
    if (!date_of_birth) {
      age = null;
      age_group = null;
    } else {
      const dob = new Date(date_of_birth);
      if (isNaN(dob.getTime()))
        return NextResponse.json({ error: "Invalid date_of_birth" }, { status: 400 });
      const result = getAgeAndGroup(dob);
      if (!result)
        return NextResponse.json(
          { error: "Date of birth must give an age between 7 and 14 (as of Oct 31)" },
          { status: 400 }
        );
      age = result.age;
      age_group = result.age_group;
    }
  }

  const supabase = createSupabaseServerClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name ? String(name).trim() : null;
  if (majlis_id !== undefined) updates.majlis_id = majlis_id || null;
  if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth || null;
  if (age !== undefined) updates.age = age;
  if (age_group !== undefined) updates.age_group = age_group;

  const { error } = await supabase.from("users").update(updates).eq("id", session.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
