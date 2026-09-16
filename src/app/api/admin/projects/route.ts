import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { projectSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = projectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.project.count();
  const created = await prisma.project.create({
    data: { ...parsed.data, links: parsed.data.links as Prisma.InputJsonValue, sortOrder: count },
  });
  return NextResponse.json(created, { status: 201 });
}
