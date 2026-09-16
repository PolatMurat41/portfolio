import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/session";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionCookieValue(cookie);
  if (!valid) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
