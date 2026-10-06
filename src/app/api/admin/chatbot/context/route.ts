import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { buildSystemPrompt } from "@/lib/chatbot/context";

const bodySchema = z.object({
  systemPrompt: z.string().max(20000),
  includeContext: z.boolean(),
  language: z.enum(["tr", "en"]).default("tr"),
});

// Renders the exact system prompt the model receives, for the admin preview.
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const prompt = await buildSystemPrompt(parsed.data, parsed.data.language);
  return NextResponse.json({ prompt, characters: prompt.length, approxTokens: Math.ceil(prompt.length / 3.5) });
}
