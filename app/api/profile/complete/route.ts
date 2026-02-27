import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getAgeAndGroup } from "@/lib/mayar";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl")
    return NextResponse.json({ error: "Only Tifls complete profile" }, { status: 403 });

  const body = await request.json();
  const { date_of_birth, name, majlis_id } = body;
  if (!date_of_birth) return NextResponse.json({ error: "date_of_birth required" }, { status: 400 });

  const dob = new Date(date_of_birth);
  if (isNaN(dob.getTime()))
    return NextResponse.json({ error: "Invalid date_of_birth" }, { status: 400 });

  const result = getAgeAndGroup(dob);
  if (!result)
    return NextResponse.json(
      { error: "Date of birth must give an age between 7 and 14 (as of Oct 31)" },
      { status: 400 }
    );

  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("users")
    .update({
      date_of_birth: date_of_birth,
      age: result.age,
      age_group: result.age_group,
      name: name ? String(name).trim() : null,
      majlis_id: majlis_id ?? null,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
