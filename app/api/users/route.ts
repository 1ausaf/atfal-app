import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim")
    return NextResponse.json({ error: "Only Regional Nazim can create users" }, { status: 403 });
  const body = await request.json();
  const { member_code, password, role, majlis_id, name } = body;
  if (!member_code || !password) return NextResponse.json({ error: "member_code and password required" }, { status: 400 });
  if (!["tifl", "local_nazim"].includes(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  if (role === "local_nazim" && !majlis_id) return NextResponse.json({ error: "majlis_id required for Local Nazim" }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 10);
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .insert({
      member_code: String(member_code).trim(),
      password_hash: passwordHash,
      role,
      majlis_id: role === "local_nazim" ? majlis_id : null,
      name: name ? String(name).trim() : null,
      profile_completed: role !== "tifl",
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Member code already exists" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
