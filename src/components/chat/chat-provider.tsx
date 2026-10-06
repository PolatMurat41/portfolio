"use client";

import { ChatWidget } from "@/components/chat/chat-widget";
import type { ChatbotPublicConfig } from "@/lib/chatbot/settings";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface ChatContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Opens the panel, optionally sending a first question right away. */
  openChat: (prompt?: string) => void;
  pendingPrompt: string | null;
  consumePendingPrompt: () => string | null;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/** Null when the chatbot is disabled, so callers can hide their entry points. */
export function useChat() {
  return useContext(ChatContext);
}

export function ChatProvider({
  config,
  children,
}: {
  config: ChatbotPublicConfig | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const openChat = useCallback((prompt?: string) => {
    if (prompt) setPendingPrompt(prompt);
    setOpen(true);
  }, []);

  const consumePendingPrompt = useCallback(() => {
    const prompt = pendingPrompt;
    if (prompt) setPendingPrompt(null);
    return prompt;
  }, [pendingPrompt]);

  const value = useMemo(
    () => ({ open, setOpen, openChat, pendingPrompt, consumePendingPrompt }),
    [open, openChat, pendingPrompt, consumePendingPrompt]
  );

  if (!config) return <>{children}</>;

  return (
    <ChatContext.Provider value={value}>
      {children}
      <ChatWidget config={config} />
    </ChatContext.Provider>
  );
}
