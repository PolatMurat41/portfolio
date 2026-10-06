"use client";

import { ChatMarkdown, readTextStream } from "@/components/chat/chat-markdown";
import { useChat } from "@/components/chat/chat-provider";
import { AnimatedDotGrid } from "@/components/magicui/animated-dot-grid";
import { useLanguage } from "@/context/language-context";
import type { ChatbotPublicConfig } from "@/lib/chatbot/settings";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { ArrowUp, RotateCcw, Sparkles, Square, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

interface StoredState {
  conversationId: string | null;
  messages: Message[];
}

const STATE_KEY = "portfolio_chat_state";
const VISITOR_KEY = "portfolio_chat_visitor";
const TEASER_KEY = "portfolio_chat_teaser_seen";
const MAX_CHARS = 2000;

function randomId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredState;
      if (Array.isArray(parsed.messages)) return parsed;
    }
  } catch {
    // ignore unreadable state
  }
  return { conversationId: null, messages: [] };
}

function saveState(state: StoredState) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked: the chat still works for this page view
  }
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground/70 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </span>
  );
}

function BotAvatar({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background",
        className
      )}
    >
      <Sparkles className="size-[55%]" />
    </span>
  );
}

export function ChatWidget({ config }: { config: ChatbotPublicConfig }) {
  const chat = useChat();
  const { language } = useLanguage();
  const t = translations[language].chat;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showTeaser, setShowTeaser] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [hydrated, setHydrated] = useState(false);

  const open = chat?.open ?? false;
  const setOpen = chat?.setOpen;

  const welcome =
    language === "en" ? config.welcomeMessageEn || config.welcomeMessage : config.welcomeMessage;
  const suggestions =
    language === "en" && config.suggestionsEn.length ? config.suggestionsEn : config.suggestions;

  useEffect(() => {
    const state = loadState();
    setMessages(state.messages.filter((m) => m.content || m.error));
    setConversationId(state.conversationId);
    setHydrated(true);

    let seen = false;
    try {
      seen = localStorage.getItem(TEASER_KEY) === "1";
    } catch {
      // ignore
    }
    if (seen) return;
    const timer = setTimeout(() => setShowTeaser(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hydrated && !streaming) saveState({ conversationId, messages });
  }, [hydrated, conversationId, messages, streaming]);

  const dismissTeaser = useCallback(() => {
    setShowTeaser(false);
    try {
      localStorage.setItem(TEASER_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    dismissTeaser();
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen?.(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, dismissTeaser]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: streaming ? "auto" : "smooth" });
  }, [messages, open, streaming]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const send = useCallback(
    async (text: string) => {
      const message = text.trim().slice(0, MAX_CHARS);
      if (!message || streaming) return;

      const assistantId = randomId();
      const updateAssistant = (patch: Partial<Message>) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)));

      setInput("");
      setMessages((prev) => [
        ...prev.filter((m) => !m.error),
        { id: randomId(), role: "user", content: message },
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, visitorId: getVisitorId(), language, message }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const code = data?.error as keyof typeof t.errors;
          updateAssistant({ content: t.errors[code] ?? t.errors.generic, error: true });
          if (code === "conversation_limit") setConversationId(null);
          return;
        }
        const newId = res.headers.get("X-Conversation-Id");
        if (newId) setConversationId(newId);
        const reply = await readTextStream(res, (content) => updateAssistant({ content }));
        if (!reply.trim()) updateAssistant({ content: t.errors.generic, error: true });
      } catch (error) {
        if ((error as Error)?.name !== "AbortError") {
          updateAssistant({ content: t.errors.generic, error: true });
        }
      } finally {
        abortRef.current = null;
        setStreaming(false);
        setMessages((prev) => prev.filter((m) => m.content || m.error));
      }
    },
    [conversationId, language, streaming, t]
  );

  // A question handed over from elsewhere on the page (e.g. the hero button).
  useEffect(() => {
    if (!open || streaming || !chat?.pendingPrompt) return;
    const prompt = chat.consumePendingPrompt();
    if (prompt) void send(prompt);
  }, [open, streaming, chat, send]);

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(null);
    setInput("");
    inputRef.current?.focus();
  };

  const hasUserMessages = messages.some((m) => m.role === "user");

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {showTeaser && !open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="relative max-w-[240px] rounded-2xl border bg-card px-4 py-3 pr-8 text-sm shadow-xl"
            >
              <button
                type="button"
                onClick={() => setOpen?.(true)}
                className="text-left text-card-foreground"
              >
                {t.teaser}
              </button>
              <button
                type="button"
                onClick={dismissTeaser}
                aria-label={t.close}
                className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {!open && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setOpen?.(true)}
              aria-label={t.launcher}
              title={t.launcher}
              className="group relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_30px_-6px] shadow-primary/40 ring-1 ring-border"
            >
              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping [animation-duration:2.5s]" />
              <Sparkles className="relative size-6 transition-transform duration-300 group-hover:rotate-12" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={config.botName}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed inset-x-3 bottom-3 z-50 flex h-[min(640px,calc(100dvh-1.5rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:h-[min(620px,calc(100dvh-3rem))] sm:w-[400px]"
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden border-b bg-card">
              <AnimatedDotGrid
                className="absolute inset-0"
                maxOpacity={0.35}
                style={{
                  maskImage: "linear-gradient(to bottom, black, transparent)",
                  WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
                }}
              />
              <div className="relative flex items-center gap-3 px-4 py-3.5">
                <div className="relative">
                  <BotAvatar className="size-10" />
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight">{config.botName}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.online}</p>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  disabled={!hasUserMessages && !streaming}
                  title={t.reset}
                  aria-label={t.reset}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
                >
                  <RotateCcw className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen?.(false)}
                  title={t.close}
                  aria-label={t.close}
                  className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5" aria-live="polite">
              <div className="flex gap-2.5">
                <BotAvatar className="mt-0.5 size-7" />
                <div className="rounded-2xl rounded-tl-md bg-muted px-3.5 py-2.5">
                  <ChatMarkdown content={welcome} />
                </div>
              </div>

              {!hasUserMessages && suggestions.length > 0 && (
                <div className="flex flex-col items-start gap-2 pl-9">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {t.suggestions}
                  </p>
                  {suggestions.map((s, i) => (
                    <motion.button
                      key={s}
                      type="button"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      onClick={() => void send(s)}
                      className="rounded-xl border bg-background px-3 py-1.5 text-left text-[13px] text-foreground transition-colors hover:border-foreground/30 hover:bg-muted"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              )}

              {messages.map((m) =>
                m.role === "user" ? (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-md bg-primary px-3.5 py-2.5 text-[13.5px] leading-relaxed text-primary-foreground">
                      {m.content}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5"
                  >
                    <BotAvatar className="mt-0.5 size-7" />
                    <div
                      className={cn(
                        "min-w-0 max-w-[85%] rounded-2xl rounded-tl-md px-3.5 py-2.5",
                        m.error ? "border border-destructive/30 bg-destructive/10 text-destructive" : "bg-muted"
                      )}
                    >
                      {m.content ? (
                        m.error ? (
                          <p className="text-[13px]">{m.content}</p>
                        ) : (
                          <ChatMarkdown content={m.content} />
                        )
                      ) : (
                        <TypingDots />
                      )}
                    </div>
                  </motion.div>
                )
              )}
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="shrink-0 border-t bg-card/60 p-3"
            >
              <div className="flex items-end gap-2 rounded-xl border bg-background px-3 py-2 transition-colors focus-within:border-foreground/30">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, MAX_CHARS))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      void send(input);
                    }
                  }}
                  rows={1}
                  placeholder={t.placeholder}
                  aria-label={t.placeholder}
                  className="max-h-[140px] min-h-[24px] flex-1 resize-none bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground"
                />
                {streaming ? (
                  <button
                    type="button"
                    onClick={() => abortRef.current?.abort()}
                    title={t.stop}
                    aria-label={t.stop}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground transition-colors hover:bg-muted/70"
                  >
                    <Square className="size-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    title={t.send}
                    aria-label={t.send}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">{t.disclaimer}</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
