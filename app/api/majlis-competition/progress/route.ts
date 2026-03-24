import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMajlisCompetitionProgress } from "@/lib/majlis-competition";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const scopeMajlisId = url.searchParams.get("majlis_id");
  const payload = await getMajlisCompetitionProgress();

  const feedRows = payload.feedRows.filter((row) => {
    if (session.user.role === "regional_nazim" || session.user.role === "local_nazim" || session.user.role === "admin") return true;
    if (scopeMajlisId) return row.majlis_id === scopeMajlisId;
    if (session.user.majlisId) return row.majlis_id === session.user.majlisId;
    return false;
  });

  return NextResponse.json({
    season: payload.season,
    progressRows: payload.progressRows,
    feedRows,
  });
}
