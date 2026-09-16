import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
  createSessionCookieValue,
} from "@/lib/session";

const loginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }

  const valid = await bcrypt.compare(parsed.data.password, hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await createSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}
