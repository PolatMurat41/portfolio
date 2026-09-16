import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { blogPostSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = blogPostSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const created = await prisma.blogPost.create({
      data: { ...parsed.data, publishedAt: parsed.data.draft ? null : new Date() },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Slug is already in use" }, { status: 409 });
    }
    throw error;
  }
}
