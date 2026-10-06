import Link from "next/link";
import { apiKeySource, getChatbotSettings, getChatbotUsage, maskApiKey } from "@/lib/chatbot/settings";
import { ChatbotSettingsForm } from "@/components/admin/chatbot-settings-form";
import { Button } from "@/components/ui/button";
import { Bot, MessagesSquare } from "lucide-react";

export default async function ChatbotAdminPage() {
  const [settings, { conversations, messagesToday, totalMessages }] = await Promise.all([
    getChatbotSettings(),
    getChatbotUsage(),
  ]);

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
            <Bot className="size-7" />
            AI Chatbot
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sitedeki yapay zeka asistanının modelini, sistem promptunu ve limitlerini buradan yönetin.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-xl gap-2 w-fit">
          <Link href="/admin/chatbot/conversations">
            <MessagesSquare className="size-4" />
            Konuşma Kayıtları ({conversations})
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-2xl p-5 bg-card">
          <p className="text-3xl font-bold tracking-tight">{conversations}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Toplam konuşma</p>
        </div>
        <div className="border rounded-2xl p-5 bg-card">
          <p className="text-3xl font-bold tracking-tight">{totalMessages}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Ziyaretçi mesajı (toplam)</p>
        </div>
        <div className="border rounded-2xl p-5 bg-card">
          <p className="text-3xl font-bold tracking-tight">
            {messagesToday}
            {settings.dailyLimit > 0 && (
              <span className="text-base font-medium text-muted-foreground"> / {settings.dailyLimit}</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">Son 24 saatteki mesajlar</p>
        </div>
      </div>

      <ChatbotSettingsForm
        initialValues={{
          enabled: settings.enabled,
          provider: settings.provider === "openai" ? "openai" : "anthropic",
          model: settings.model,
          baseUrl: settings.baseUrl ?? "",
          botName: settings.botName,
          systemPrompt: settings.systemPrompt,
          includeContext: settings.includeContext,
          effort: (["low", "medium", "high"].includes(settings.effort) ? settings.effort : "low") as
            | "low"
            | "medium"
            | "high",
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          welcomeMessage: settings.welcomeMessage,
          welcomeMessageEn: settings.welcomeMessageEn ?? "",
          suggestions: settings.suggestions,
          suggestionsEn: settings.suggestionsEn,
          rateLimitPerHour: settings.rateLimitPerHour,
          dailyLimit: settings.dailyLimit,
        }}
        apiKey={{ masked: maskApiKey(settings.apiKey), source: apiKeySource(settings) }}
      />
    </div>
  );
}
