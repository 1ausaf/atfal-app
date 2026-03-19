import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getTodayToronto } from "@/lib/datetime";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "tifl") return NextResponse.json({ error: "Only Tifls can submit letters" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const letterPayload = body?.letter_payload;
  if (!letterPayload || typeof letterPayload !== "object") {
    return NextResponse.json({ error: "letter_payload required" }, { status: 400 });
  }

  const submissionMonth = getTodayToronto().slice(0, 7); // YYYY-MM in Toronto

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("activity_letter_huzoor_submissions")
    .upsert(
      {
        user_id: session.user.id,
        submission_month: submissionMonth,
        letter_payload: letterPayload,
      },
      { onConflict: "user_id,submission_month" }
    )
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message ?? "Failed to submit letter" }, { status: 500 });

  return NextResponse.json({ ok: true, id: data?.id ?? null });
}

