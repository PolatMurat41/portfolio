import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { applyReorder } from "@/lib/admin-reorder";

const schema = z.object({ ids: z.array(z.string()).min(1) });

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await applyReorder(prisma.project, parsed.data.ids);
  return NextResponse.json({ ok: true });
}
