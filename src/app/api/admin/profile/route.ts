import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { profileSchema, socialLinksSchema } from "@/lib/validation";

const bodySchema = z.object({
  profile: profileSchema,
  social: socialLinksSchema.shape.links,
});

export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.profile.update({ where: { id: 1 }, data: parsed.data.profile });
  await prisma.$transaction(
    parsed.data.social.map((link) =>
      prisma.socialLink.update({
        where: { platform: link.platform },
        data: { url: link.url, showInNavbar: link.showInNavbar },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
