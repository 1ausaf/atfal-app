import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isBeforeSeason3 } from "@/lib/season-over";

function isPathAllowlisted(pathname: string): boolean {
  if (pathname.startsWith("/season-over")) return true;
  if (pathname === "/login" || pathname === "/signup") return true;
  if (pathname.startsWith("/profile/complete")) return true;
  if (pathname === "/banned") return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/signout") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isBeforeSeason3()) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.next();
  }

  const role = (token.role as string) ?? "";
  const profileCompleted = Boolean(token.profile_completed);
  const isBanned = Boolean(token.isBanned);

  if (role !== "tifl") {
    return NextResponse.next();
  }

  if (isBanned || !profileCompleted) {
    return NextResponse.next();
  }

  if (isPathAllowlisted(pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/season-over";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
