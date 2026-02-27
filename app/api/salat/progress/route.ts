import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl")
    return NextResponse.json({ error: "Only Tifls can request a test" }, { status: 403 });

  const body = await request.json();
  const categoryId = body.category_id;
  if (!categoryId) return NextResponse.json({ error: "category_id required" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from("salat_progress").upsert(
    {
      user_id: session.user.id,
      category_id: categoryId,
      status: "ready_for_test",
      requested_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,category_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
