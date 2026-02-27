import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createSupabaseServerClient();
  const majlisId = session.user.majlisId;

  const [localRes, regionalRes] = await Promise.all([
    majlisId
      ? supabase
          .from("users")
          .select("id, name")
          .eq("role", "local_nazim")
          .eq("majlis_id", majlisId)
          .is("deleted_at", null)
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("users")
      .select("id, name")
      .eq("role", "regional_nazim")
      .is("deleted_at", null)
      .order("name")
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    local_nazim: localRes.data ? { id: localRes.data.id, name: localRes.data.name ?? "Local Nazim Atfal" } : null,
    regional_nazim: regionalRes.data ? { id: regionalRes.data.id, name: regionalRes.data.name ?? "Regional Nazim Atfal" } : null,
  });
}
