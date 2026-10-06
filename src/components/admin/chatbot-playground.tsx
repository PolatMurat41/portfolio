"use client";

import { useEffect, useRef, useState } from "react";
import { ChatMarkdown, readTextStream } from "@/components/chat/chat-markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUp, FlaskConical, RotateCcw, Square } from "lucide-react";

interface Turn {
  role: "user" | "assistant";
  content: string;
  error?: string;
  seconds?: number;
}

export function ChatbotPlayground({
  getSettings,
  botName,
  welcome,
}: {
  /** Current (possibly unsaved) form values, so changes can be tried before saving. */
  getSettings: () => unknown;
  botName: string;
  welcome: string;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"tr" | "en">("tr");
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const history = [...turns.filter((t) => !t.error), { role: "user" as const, content: text }];
    setTurns([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    const setReply = (patch: Partial<Turn>) =>
      setTurns((prev) => prev.map((t, i) => (i === prev.length - 1 ? { ...t, ...patch } : t)));

    const controller = new AbortController();
    abortRef.current = controller;
    const started = performance.now();
    try {
      const res = await fetch("/api/admin/chatbot/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: getSettings(),
          language,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setReply({ error: [data.error, data.detail].filter(Boolean).join("\n") || `HTTP ${res.status}` });
        return;
      }
      await readTextStream(res, (content) => setReply({ content }));
      setReply({ seconds: (performance.now() - started) / 1000 });
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") setReply({ error: String(error) });
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  return (
    <section className="border border-border rounded-2xl bg-card/60 flex flex-col h-[640px] overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold flex items-center gap-2">
            <FlaskConical className="size-4" />
            Canlı Test
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            Kaydedilmemiş ayarlarla dener · konuşma kaydedilmez
          </p>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex rounded-lg bg-muted p-0.5 text-[11px] font-medium">
            {(["tr", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={cn(
                  "px-2 py-1 rounded-md uppercase",
                  language === lang ? "bg-background shadow-sm" : "text-muted-foreground"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              abortRef.current?.abort();
              setTurns([]);
            }}
            title="Sıfırla"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-muted px-3.5 py-2.5">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">{botName}</p>
          <ChatMarkdown content={welcome} />
        </div>
        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-primary px-3.5 py-2.5 text-[13.5px] text-primary-foreground">
                {turn.content}
              </div>
            </div>
          ) : turn.error ? (
            <div
              key={i}
              className="max-w-[95%] rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive whitespace-pre-wrap break-words"
            >
              {turn.error}
            </div>
          ) : (
            <div key={i} className="max-w-[90%] rounded-2xl rounded-tl-md bg-muted px-3.5 py-2.5">
              {turn.content ? (
                <>
                  <ChatMarkdown content={turn.content} />
                  {turn.seconds != null && (
                    <p className="mt-1.5 text-[10px] text-muted-foreground">{turn.seconds.toFixed(1)} sn</p>
                  )}
                </>
              ) : (
                <span className="text-xs text-muted-foreground animate-pulse">Yanıt bekleniyor…</span>
              )}
            </div>
          )
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="border-t p-3 flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
          rows={2}
          placeholder="Bir test sorusu yazın..."
          className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {busy ? (
          <Button type="button" size="icon" variant="secondary" className="rounded-xl" onClick={() => abortRef.current?.abort()}>
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button type="submit" size="icon" className="rounded-xl" disabled={!input.trim()}>
            <ArrowUp className="size-4" />
          </Button>
        )}
      </form>
    </section>
  );
}
