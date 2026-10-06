import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashClientIp } from "@/lib/request-meta";
import {
  getChatbotSettings,
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_CHARS,
  MAX_USER_MESSAGES_PER_CONVERSATION,
  resolveApiKey,
} from "@/lib/chatbot/settings";
import { buildSystemPrompt } from "@/lib/chatbot/context";
import { ChatProviderError, createReplyStream, streamChatReply, type ChatTurn } from "@/lib/chatbot/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  conversationId: z.string().max(64).optional().nullable(),
  visitorId: z.string().min(8).max(64),
  language: z.enum(["tr", "en"]).default("tr"),
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});

function error(code: string, status: number) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error("invalid_request", 400);
  const { visitorId, language, message } = parsed.data;

  const settings = await getChatbotSettings();
  const apiKey = resolveApiKey(settings);
  if (!settings.enabled || !apiKey) return error("disabled", 503);

  const ipHash = hashClientIp(request);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [sentThisHour, sentToday] = await Promise.all([
    prisma.chatMessage.count({
      where: { role: "user", createdAt: { gte: hourAgo }, conversation: { ipHash } },
    }),
    settings.dailyLimit > 0
      ? prisma.chatMessage.count({ where: { role: "user", createdAt: { gte: dayAgo } } })
      : Promise.resolve(0),
  ]);
  if (sentThisHour >= settings.rateLimitPerHour) return error("rate_limited", 429);
  if (settings.dailyLimit > 0 && sentToday >= settings.dailyLimit) return error("daily_limit", 429);

  // A conversation id from another visitor is ignored rather than trusted.
  let conversation = parsed.data.conversationId
    ? await prisma.chatConversation.findUnique({ where: { id: parsed.data.conversationId } })
    : null;
  if (!conversation || conversation.visitorId !== visitorId) {
    conversation = await prisma.chatConversation.create({ data: { visitorId, ipHash, language } });
  }

  const [userMessageCount, recent] = await Promise.all([
    prisma.chatMessage.count({ where: { conversationId: conversation.id, role: "user" } }),
    prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      take: MAX_HISTORY_MESSAGES,
    }),
  ]);
  if (userMessageCount >= MAX_USER_MESSAGES_PER_CONVERSATION) return error("conversation_limit", 429);

  const history: ChatTurn[] = recent
    .reverse()
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));
  // The API requires the first turn to be the user's.
  while (history.length && history[0].role !== "user") history.shift();

  await prisma.chatMessage.create({
    data: { conversationId: conversation.id, role: "user", content: message },
  });

  const conversationId = conversation.id;
  const system = await buildSystemPrompt(settings, language);
  const generator = streamChatReply({
    settings,
    apiKey,
    system,
    messages: [...history, { role: "user", content: message }],
    signal: request.signal,
  });

  try {
    const body = await createReplyStream(generator, {
      errorNote:
        language === "en"
          ? "\n\n_(The reply was interrupted. Please try again.)_"
          : "\n\n_(Yanıt yarıda kesildi. Lütfen tekrar deneyin.)_",
      onComplete: async (text) => {
        if (!text.trim()) return;
        await prisma.chatMessage.create({ data: { conversationId, role: "assistant", content: text } });
        await prisma.chatConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      },
    });
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Conversation-Id": conversationId,
      },
    });
  } catch (e) {
    if (e instanceof ChatProviderError) {
      console.error(`Chat provider error (${e.code}):`, e.detail);
      return error(e.code === "rate_limit" ? "busy" : "provider_error", 502);
    }
    console.error("Chat request failed:", e);
    return error("provider_error", 502);
  }
}
