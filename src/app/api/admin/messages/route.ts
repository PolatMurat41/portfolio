import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// Marks every contact message as read.
export async function PATCH() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  await prisma.contactMessage.updateMany({ where: { read: false }, data: { read: true } });
  return NextResponse.json({ ok: true });
}
