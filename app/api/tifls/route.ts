import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const majlisId = searchParams.get("majlis_id");
  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("users")
    .select("id, name, age, age_group, majlis_id, created_at")
    .eq("role", "tifl")
    .is("deleted_at", null);
  if (session.user.role === "local_nazim") {
    if (!session.user.majlisId) return NextResponse.json({ error: "No Majlis" }, { status: 403 });
    query = query.eq("majlis_id", session.user.majlisId);
  } else if (session.user.role === "regional_nazim" && majlisId) {
    query = query.eq("majlis_id", majlisId);
  }
  const { data, error } = await query.order("name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const { data: majlis } = await supabase.from("majlis").select("id, name");
  const majlisMap = new Map((majlis ?? []).map((m) => [m.id, m.name]));
  const withMajlis = (data ?? []).map((u) => ({
    ...u,
    majlis_name: u.majlis_id ? majlisMap.get(u.majlis_id) : null,
  }));
  return NextResponse.json(withMajlis);
}
