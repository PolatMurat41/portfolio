import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { chatbotSettingsSchema } from "@/lib/validation";
import { getChatbotSettings } from "@/lib/chatbot/settings";

export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = chatbotSettingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await getChatbotSettings(); // creates the row on first save
  const { apiKey, clearApiKey, baseUrl, welcomeMessageEn, temperature, ...rest } = parsed.data;
  await prisma.chatbotSettings.update({
    where: { id: 1 },
    data: {
      ...rest,
      baseUrl: baseUrl || null,
      welcomeMessageEn: welcomeMessageEn || null,
      temperature: temperature ?? null,
      ...(clearApiKey ? { apiKey: null } : apiKey ? { apiKey } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}
