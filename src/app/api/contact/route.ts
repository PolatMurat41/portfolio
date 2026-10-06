import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureSchema } from "@/lib/schema-sync";
import { hashClientIp } from "@/lib/request-meta";
import { contactMessageSchema } from "@/lib/validation";

const MAX_MESSAGES_PER_HOUR = 5;

export async function POST(request: Request) {
  const parsed = contactMessageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { website, ...data } = parsed.data;
  if (website) return NextResponse.json({ ok: true });

  await ensureSchema();
  const ipHash = hashClientIp(request);
  const recent = await prisma.contactMessage.count({
    where: { ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
  });
  if (recent >= MAX_MESSAGES_PER_HOUR) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  await prisma.contactMessage.create({
    data: { ...data, subject: data.subject || null, ipHash },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
