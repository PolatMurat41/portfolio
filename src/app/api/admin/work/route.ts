import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { workSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = workSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.workExperience.count();
  const created = await prisma.workExperience.create({ data: { ...parsed.data, sortOrder: count } });
  return NextResponse.json(created, { status: 201 });
}
