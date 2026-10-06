import type { ChatbotSettings } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureSchema } from "@/lib/schema-sync";
import {
  DEFAULT_SUGGESTIONS,
  DEFAULT_SUGGESTIONS_EN,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_WELCOME_MESSAGE,
  DEFAULT_WELCOME_MESSAGE_EN,
} from "@/lib/chatbot/defaults";

export {
  MAX_HISTORY_MESSAGES,
  MAX_MESSAGE_CHARS,
  MAX_USER_MESSAGES_PER_CONVERSATION,
} from "@/lib/chatbot/defaults";

export async function getChatbotSettings(): Promise<ChatbotSettings> {
  await ensureSchema();
  const existing = await prisma.chatbotSettings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.chatbotSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      welcomeMessage: DEFAULT_WELCOME_MESSAGE,
      welcomeMessageEn: DEFAULT_WELCOME_MESSAGE_EN,
      suggestions: DEFAULT_SUGGESTIONS,
      suggestionsEn: DEFAULT_SUGGESTIONS_EN,
    },
  });
}

// The key saved in the admin panel wins; the environment is the fallback so
// the key can also live in Vercel's env settings instead of the database.
export function resolveApiKey(settings: Pick<ChatbotSettings, "apiKey" | "provider">): string | null {
  const providerEnv =
    settings.provider === "openai" ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
  return settings.apiKey?.trim() || process.env.AI_API_KEY?.trim() || providerEnv?.trim() || null;
}

export function apiKeySource(settings: Pick<ChatbotSettings, "apiKey" | "provider">): "database" | "env" | null {
  if (settings.apiKey?.trim()) return "database";
  return resolveApiKey(settings) ? "env" : null;
}

export function maskApiKey(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.length <= 10) return "••••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export interface ChatbotPublicConfig {
  botName: string;
  welcomeMessage: string;
  welcomeMessageEn: string | null;
  suggestions: string[];
  suggestionsEn: string[];
}

// Null when the chatbot is switched off or has no API key, so the widget is
// never shown in a state where every message would fail.
export async function getChatbotPublicConfig(): Promise<ChatbotPublicConfig | null> {
  try {
    const settings = await getChatbotSettings();
    if (!settings.enabled || !resolveApiKey(settings)) return null;
    return {
      botName: settings.botName,
      welcomeMessage: settings.welcomeMessage,
      welcomeMessageEn: settings.welcomeMessageEn,
      suggestions: settings.suggestions,
      suggestionsEn: settings.suggestionsEn,
    };
  } catch (e) {
    console.error("Could not load chatbot settings:", e);
    return null;
  }
}

export async function getChatbotUsage() {
  await ensureSchema();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [conversations, messagesToday, totalMessages] = await Promise.all([
    prisma.chatConversation.count(),
    prisma.chatMessage.count({ where: { role: "user", createdAt: { gte: dayAgo } } }),
    prisma.chatMessage.count({ where: { role: "user" } }),
  ]);
  return { conversations, messagesToday, totalMessages };
}
