"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { TranslateButton } from "@/components/admin/translate-button";
import { ChatbotPlayground } from "@/components/admin/chatbot-playground";
import { cn } from "@/lib/utils";
import { DEFAULT_SYSTEM_PROMPT } from "@/lib/chatbot/defaults";
import { Eye, EyeOff, FileText, KeyRound, Loader2, RotateCcw, Save, ShieldCheck } from "lucide-react";

export interface ChatbotFormValues {
  enabled: boolean;
  provider: "anthropic" | "openai";
  model: string;
  baseUrl: string;
  botName: string;
  systemPrompt: string;
  includeContext: boolean;
  effort: "low" | "medium" | "high";
  temperature: number | null;
  maxTokens: number;
  welcomeMessage: string;
  welcomeMessageEn: string;
  suggestions: string[];
  suggestionsEn: string[];
  rateLimitPerHour: number;
  dailyLimit: number;
}

interface ApiKeyStatus {
  masked: string | null;
  source: "database" | "env" | null;
}

const ANTHROPIC_MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5", hint: "En yetenekli · $4 / $20 (1M token)" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", hint: "Hızlı ve dengeli · $2 / $10" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", hint: "En hızlı ve ekonomik · $1 / $5" },
];

const OPENAI_BASE_URLS = [
  { url: "https://api.openai.com/v1", label: "OpenAI" },
  { url: "https://openrouter.ai/api/v1", label: "OpenRouter" },
  { url: "https://api.groq.com/openai/v1", label: "Groq" },
  { url: "http://localhost:11434/v1", label: "Ollama" },
];

const EFFORT_LABELS: Record<ChatbotFormValues["effort"], string> = {
  low: "Düşük (önerilen)",
  medium: "Orta",
  high: "Yüksek",
};

function linesToList(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-border rounded-2xl bg-card/60 p-5 md:p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function ChatbotSettingsForm({
  initialValues,
  apiKey,
}: {
  initialValues: ChatbotFormValues;
  apiKey: ApiKeyStatus;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ChatbotFormValues>(initialValues);
  const [suggestionsText, setSuggestionsText] = useState(initialValues.suggestions.join("\n"));
  const [suggestionsEnText, setSuggestionsEnText] = useState(initialValues.suggestionsEn.join("\n"));
  const [newApiKey, setNewApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [clearApiKey, setClearApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [preview, setPreview] = useState<{ prompt: string; approxTokens: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const set = <K extends keyof ChatbotFormValues>(key: K, value: ChatbotFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const hasKey = !clearApiKey && (Boolean(newApiKey.trim()) || apiKey.source !== null);
  const status = !values.enabled
    ? { label: "Kapalı", className: "bg-muted text-muted-foreground" }
    : hasKey
      ? { label: "Yayında", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" }
      : { label: "API anahtarı eksik — sitede görünmez", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" };

  function payload() {
    return {
      ...values,
      baseUrl: values.provider === "openai" ? values.baseUrl.trim() : "",
      welcomeMessageEn: values.welcomeMessageEn.trim() || null,
      suggestions: linesToList(suggestionsText),
      suggestionsEn: linesToList(suggestionsEnText),
      apiKey: newApiKey.trim() || undefined,
      clearApiKey,
    };
  }

  function switchProvider(provider: ChatbotFormValues["provider"]) {
    setValues((prev) => {
      if (prev.provider === provider) return prev;
      const isClaude = prev.model.startsWith("claude-");
      return {
        ...prev,
        provider,
        model: provider === "anthropic" ? (isClaude ? prev.model : "claude-opus-5-5") : isClaude ? "" : prev.model,
        baseUrl: provider === "openai" && !prev.baseUrl ? OPENAI_BASE_URLS[0].url : prev.baseUrl,
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/chatbot", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload()),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const fields = data?.error?.fieldErrors ? Object.keys(data.error.fieldErrors).join(", ") : "";
      setMessage({ type: "error", text: `Kaydedilemedi.${fields ? ` Hatalı alanlar: ${fields}` : ""}` });
      return;
    }
    setNewApiKey("");
    setClearApiKey(false);
    setMessage({ type: "success", text: "Ayarlar kaydedildi." });
    router.refresh();
  }

  async function loadPreview() {
    setPreviewLoading(true);
    const res = await fetch("/api/admin/chatbot/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt: values.systemPrompt, includeContext: values.includeContext }),
    });
    setPreviewLoading(false);
    if (res.ok) setPreview(await res.json());
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6 items-start">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 min-w-0">
        {/* Status */}
        <section className="border border-border rounded-2xl bg-card/60 p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              role="switch"
              aria-checked={values.enabled}
              aria-label="Chatbot'u etkinleştir"
              onClick={() => set("enabled", !values.enabled)}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
                values.enabled ? "bg-emerald-500 border-emerald-500" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "inline-block size-5 rounded-full bg-white shadow transition-transform",
                  values.enabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
            <div>
              <p className="font-semibold">Chatbot sitede {values.enabled ? "aktif" : "kapalı"}</p>
              <p className="text-xs text-muted-foreground">
                Etkinleştirdiğinizde sağ altta sohbet butonu görünür.
              </p>
            </div>
          </div>
          <span className={cn("text-xs font-medium px-3 py-1 rounded-full w-fit", status.className)}>{status.label}</span>
        </section>

        {/* Model & connection */}
        <Section
          title="Model ve Bağlantı"
          description="Claude (Anthropic) veya OpenAI uyumlu herhangi bir API (OpenAI, OpenRouter, Groq, LiteLLM, vLLM, Ollama) kullanabilirsiniz."
        >
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted w-full sm:w-fit">
            {(
              [
                ["anthropic", "Anthropic (Claude)"],
                ["openai", "OpenAI uyumlu"],
              ] as const
            ).map(([provider, label]) => (
              <button
                key={provider}
                type="button"
                onClick={() => switchProvider(provider)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  values.provider === provider ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {values.provider === "anthropic" ? (
            <div className="flex flex-col gap-2">
              <Label>Model</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ANTHROPIC_MODELS.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => set("model", model.id)}
                    className={cn(
                      "text-left rounded-xl border p-3 transition-all",
                      values.model === model.id
                        ? "border-foreground/40 bg-background ring-2 ring-foreground/10"
                        : "hover:border-foreground/20"
                    )}
                  >
                    <p className="text-sm font-medium">{model.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{model.hint}</p>
                  </button>
                ))}
              </div>
              <Input
                value={values.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder="claude-opus-5-5"
                className="font-mono text-xs"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Fiyatlar 1M girdi / çıktı token başınadır. Sistem promptu otomatik olarak önbelleğe alınır (prompt
                caching), tekrar eden isteklerde maliyeti düşer.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={values.model}
                  onChange={(e) => set("model", e.target.value)}
                  placeholder="ör. gpt-4o-mini, meta-llama/llama-3.3-70b-instruct"
                  className="font-mono text-xs"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  value={values.baseUrl}
                  onChange={(e) => set("baseUrl", e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="font-mono text-xs"
                />
                <div className="flex flex-wrap gap-1.5">
                  {OPENAI_BASE_URLS.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => set("baseUrl", preset.url)}
                      className="text-[11px] px-2 py-0.5 rounded-md border hover:bg-muted"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-xl border border-dashed p-4">
            <Label htmlFor="apiKey" className="flex items-center gap-2">
              <KeyRound className="size-4" />
              API Anahtarı
            </Label>
            {apiKey.source === "database" && !clearApiKey && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                Kayıtlı anahtar: <code className="font-mono">{apiKey.masked}</code> — değiştirmek için yenisini girin.
              </p>
            )}
            {apiKey.source === "env" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-emerald-500" />
                Ortam değişkeninden (AI_API_KEY) okunuyor. Buraya girerseniz bu anahtar öncelikli olur.
              </p>
            )}
            {apiKey.source === null && !newApiKey && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Henüz anahtar yok. Anahtarı girip kaydettiğinizde chatbot çalışmaya başlar.
              </p>
            )}
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? "text" : "password"}
                autoComplete="off"
                value={newApiKey}
                onChange={(e) => {
                  setNewApiKey(e.target.value);
                  if (e.target.value) setClearApiKey(false);
                }}
                placeholder={values.provider === "anthropic" ? "sk-ant-..." : "sk-..."}
                className="font-mono text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label={showKey ? "Gizle" : "Göster"}
              >
                {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {apiKey.source === "database" && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox checked={clearApiKey} onChange={(checked) => setClearApiKey(checked)} />
                Kayıtlı anahtarı sil
              </label>
            )}
            <p className="text-[11px] text-muted-foreground">
              Anahtar yalnızca sunucuda saklanır ve tarayıcıya hiçbir zaman gönderilmez.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {values.provider === "anthropic" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="effort">Düşünme seviyesi (effort)</Label>
                <select
                  id="effort"
                  value={values.effort}
                  onChange={(e) => set("effort", e.target.value as ChatbotFormValues["effort"])}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm"
                >
                  {(Object.keys(EFFORT_LABELS) as ChatbotFormValues["effort"][]).map((effort) => (
                    <option key={effort} value={effort}>
                      {EFFORT_LABELS[effort]}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Düşük: en hızlı yanıt. Yüksek: daha derin düşünür, daha yavaş ve maliyetli.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min={0}
                max={2}
                value={values.temperature ?? ""}
                onChange={(e) => set("temperature", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="Varsayılan"
              />
              <p className="text-[11px] text-muted-foreground">
                Boş = modelin varsayılanı. Yeni Claude modelleri (Opus 4.7+, Sonnet 5+) bu ayarı yok sayar.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maxTokens">Maks. yanıt token</Label>
              <Input
                id="maxTokens"
                type="number"
                min={256}
                max={64000}
                value={values.maxTokens}
                onChange={(e) => set("maxTokens", Number(e.target.value))}
                required
              />
            </div>
          </div>
        </Section>

        {/* Persona */}
        <Section
          title="Kişilik ve Sistem Promptu"
          description="Asistanın nasıl davranacağını belirleyen talimatlar. {{name}} ve {{email}} profil bilgileriyle otomatik doldurulur."
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="botName">Asistan adı</Label>
            <Input
              id="botName"
              value={values.botName}
              onChange={(e) => set("botName", e.target.value)}
              maxLength={60}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="systemPrompt">Sistem promptu</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => set("systemPrompt", DEFAULT_SYSTEM_PROMPT)}
              >
                <RotateCcw className="size-3" />
                Varsayılana sıfırla
              </Button>
            </div>
            <Textarea
              id="systemPrompt"
              rows={16}
              value={values.systemPrompt}
              onChange={(e) => set("systemPrompt", e.target.value)}
              className="font-mono text-xs leading-relaxed"
              required
            />
            <p className="text-[11px] text-muted-foreground text-right">{values.systemPrompt.length} / 20000</p>
          </div>
          <label className="flex items-start gap-3 rounded-xl border p-4 cursor-pointer">
            <Checkbox
              checked={values.includeContext}
              onChange={(checked) => set("includeContext", checked)}
              className="mt-0.5"
            />
            <span>
              <span className="text-sm font-medium block">Portföy verilerini bağlama ekle</span>
              <span className="text-xs text-muted-foreground">
                Profil, iş deneyimi, eğitim, yetenekler, projeler ve makaleler admin panelindeki güncel verilerden
                otomatik olarak prompta eklenir. Böylece asistan her zaman güncel bilgiyle yanıt verir.
              </span>
            </span>
          </label>
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit gap-2 rounded-lg"
              onClick={() => (preview ? setPreview(null) : void loadPreview())}
              disabled={previewLoading}
            >
              {previewLoading ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
              {preview ? "Önizlemeyi gizle" : "Modele gönderilen tam promptu önizle"}
            </Button>
            {preview && (
              <div className="rounded-xl border bg-muted/40">
                <p className="text-[11px] text-muted-foreground px-4 py-2 border-b">
                  ≈ {preview.approxTokens.toLocaleString("tr-TR")} token
                </p>
                <pre className="max-h-96 overflow-auto p-4 text-[11px] leading-relaxed whitespace-pre-wrap font-mono">
                  {preview.prompt}
                </pre>
              </div>
            )}
          </div>
        </Section>

        {/* Welcome & suggestions */}
        <Section
          title="Karşılama ve Önerilen Sorular"
          description="Sohbet açıldığında gösterilen mesaj ve tıklanabilir örnek sorular (her satıra bir soru, en fazla 6)."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="welcomeMessage">Karşılama mesajı (Türkçe)</Label>
              <Textarea
                id="welcomeMessage"
                rows={3}
                value={values.welcomeMessage}
                onChange={(e) => set("welcomeMessage", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="welcomeMessageEn">Karşılama mesajı (İngilizce)</Label>
                <TranslateButton
                  textToTranslate={values.welcomeMessage}
                  onTranslated={(text) => set("welcomeMessageEn", text)}
                  label="Çevir"
                />
              </div>
              <Textarea
                id="welcomeMessageEn"
                rows={3}
                value={values.welcomeMessageEn}
                onChange={(e) => set("welcomeMessageEn", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="suggestions">Önerilen sorular (Türkçe)</Label>
              <Textarea
                id="suggestions"
                rows={4}
                value={suggestionsText}
                onChange={(e) => setSuggestionsText(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="suggestionsEn">Önerilen sorular (İngilizce)</Label>
                <TranslateButton textToTranslate={suggestionsText} onTranslated={setSuggestionsEnText} label="Çevir" />
              </div>
              <Textarea
                id="suggestionsEn"
                rows={4}
                value={suggestionsEnText}
                onChange={(e) => setSuggestionsEnText(e.target.value)}
              />
            </div>
          </div>
        </Section>

        {/* Limits */}
        <Section
          title="Kullanım Limitleri"
          description="API maliyetinizi kötüye kullanıma karşı korur. Limit aşıldığında ziyaretçiye nazik bir uyarı gösterilir."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rateLimitPerHour">Ziyaretçi başına saatlik mesaj</Label>
              <Input
                id="rateLimitPerHour"
                type="number"
                min={1}
                max={1000}
                value={values.rateLimitPerHour}
                onChange={(e) => set("rateLimitPerHour", Number(e.target.value))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dailyLimit">Tüm site için günlük toplam mesaj</Label>
              <Input
                id="dailyLimit"
                type="number"
                min={0}
                max={100000}
                value={values.dailyLimit}
                onChange={(e) => set("dailyLimit", Number(e.target.value))}
                required
              />
              <p className="text-[11px] text-muted-foreground">0 = sınırsız</p>
            </div>
          </div>
        </Section>

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <Button type="submit" disabled={saving} className="gap-2 rounded-xl">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </Button>
          {message && (
            <p
              className={cn(
                "text-sm font-medium",
                message.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
              )}
            >
              {message.text}
            </p>
          )}
        </div>
      </form>

      <div className="xl:sticky xl:top-6">
        <ChatbotPlayground getSettings={payload} botName={values.botName} welcome={values.welcomeMessage} />
      </div>
    </div>
  );
}
