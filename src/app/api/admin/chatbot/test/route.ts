import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { chatbotSettingsSchema } from "@/lib/validation";
import { getChatbotSettings, MAX_MESSAGE_CHARS, resolveApiKey } from "@/lib/chatbot/settings";
import { buildSystemPrompt } from "@/lib/chatbot/context";
import { ChatProviderError, createReplyStream, streamChatReply } from "@/lib/chatbot/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  // The playground runs against the form's unsaved values.
  settings: chatbotSettingsSchema,
  language: z.enum(["tr", "en"]).default("tr"),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(20000) }))
    .min(1)
    .max(40)
    .refine((messages) => messages[messages.length - 1].role === "user", "Last message must be the user's")
    .refine((messages) => messages[messages.length - 1].content.length <= MAX_MESSAGE_CHARS, "Message too long"),
});

const ERROR_HINTS: Record<ChatProviderError["code"], string> = {
  auth: "API anahtarı geçersiz veya yetkisiz.",
  model: "Model bulunamadı. Model adını ve sağlayıcıyı kontrol edin.",
  rate_limit: "Sağlayıcı istek limitine ulaşıldı. Biraz sonra tekrar deneyin.",
  bad_request: "Sağlayıcı isteği reddetti. Model ayarlarını kontrol edin.",
  network: "Sağlayıcıya bağlanılamadı. Base URL'i ve ağ erişimini kontrol edin.",
  upstream: "Sağlayıcı bir hata döndürdü.",
};

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz istek.", detail: parsed.error.message }, { status: 400 });
  }

  const saved = await getChatbotSettings();
  const form = parsed.data.settings;
  const settings = {
    ...form,
    baseUrl: form.baseUrl || null,
    temperature: form.temperature ?? null,
    apiKey: form.clearApiKey ? null : form.apiKey || saved.apiKey,
  };
  const apiKey = resolveApiKey(settings);
  if (!apiKey) {
    return NextResponse.json({ error: "API anahtarı girilmemiş." }, { status: 400 });
  }

  const system = await buildSystemPrompt(settings, parsed.data.language);
  const generator = streamChatReply({
    settings,
    apiKey,
    system,
    messages: parsed.data.messages,
    signal: request.signal,
  });

  try {
    const body = await createReplyStream(generator, { errorNote: "\n\n_(Yanıt yarıda kesildi.)_" });
    return new Response(body, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof ChatProviderError) {
      return NextResponse.json({ error: ERROR_HINTS[e.code], detail: e.detail }, { status: 502 });
    }
    console.error("Chatbot test failed:", e);
    return NextResponse.json({ error: "Beklenmeyen bir hata oluştu.", detail: String(e) }, { status: 500 });
  }
}
