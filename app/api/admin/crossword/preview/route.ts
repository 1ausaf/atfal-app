import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCrosswordFromAdminBody } from "@/lib/crossword-admin-resolve";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin")
    return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await request.json();
  const resolved = resolveCrosswordFromAdminBody(body);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: 400 });
  return NextResponse.json({ puzzle_json: resolved.puzzle });
}
