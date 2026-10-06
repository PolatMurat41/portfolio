import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function DELETE() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  await prisma.chatConversation.deleteMany({});
  return NextResponse.json({ ok: true });
}
