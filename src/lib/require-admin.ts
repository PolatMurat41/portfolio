import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/session";

export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionCookieValue(value);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
