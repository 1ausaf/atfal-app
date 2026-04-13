import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";

const MAX_BODY = 10_000;

function isAdminRole(role: string) {
  return role === "regional_nazim" || role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(session.user.role))
    return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tifl_announcements")
    .select("id, title, body, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdminRole(session.user.role))
    return NextResponse.json({ error: "Admin only" }, { status: 403 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const titleRaw = typeof o.title === "string" ? o.title.trim() : "";
  const title = titleRaw.length > 0 ? titleRaw.slice(0, 200) : null;
  const bodyText = typeof o.body === "string" ? o.body.trim() : "";

  if (!bodyText) return NextResponse.json({ error: "body is required" }, { status: 400 });
  if (bodyText.length > MAX_BODY)
    return NextResponse.json({ error: `body must be at most ${MAX_BODY} characters` }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("tifl_announcements")
    .insert({
      title,
      body: bodyText,
      created_by: session.user.id,
    })
    .select("id, title, body, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
