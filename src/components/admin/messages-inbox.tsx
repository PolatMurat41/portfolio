"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { cn } from "@/lib/utils";
import { CheckCheck, ChevronDown, Mail, MailOpen, Reply } from "lucide-react";

interface InboxMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export function MessagesInbox({ initialMessages }: { initialMessages: InboxMessage[] }) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unread = messages.filter((m) => !m.read).length;
  const visible = filter === "unread" ? messages.filter((m) => !m.read) : messages;

  async function setRead(id: string, read: boolean) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read } : m)));
    await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    });
    router.refresh();
  }

  async function markAllRead() {
    setMessages((prev) => prev.map((m) => ({ ...m, read: true })));
    await fetch("/api/admin/messages", { method: "PATCH" });
    router.refresh();
  }

  function toggle(message: InboxMessage) {
    const opening = openId !== message.id;
    setOpenId(opening ? message.id : null);
    if (opening && !message.read) void setRead(message.id, true);
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center border border-dashed rounded-2xl">
        <Mail className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Henüz mesaj yok. İletişim formundan gelen mesajlar burada görünür.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-muted p-1 text-sm font-medium">
          {(
            [
              ["all", `Tümü (${messages.length})`],
              ["unread", `Okunmamış (${unread})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                filter === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={markAllRead}>
            <CheckCheck className="size-4" />
            Tümünü okundu işaretle
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {visible.map((m) => {
          const open = openId === m.id;
          return (
            <div
              key={m.id}
              className={cn(
                "border rounded-xl bg-card/60 transition-colors",
                !m.read && "border-foreground/25 bg-card",
                open && "ring-2 ring-foreground/10"
              )}
            >
              <button type="button" onClick={() => toggle(m)} className="w-full flex items-start gap-3 p-4 text-left">
                <span className={cn("mt-1.5 size-2 rounded-full shrink-0", m.read ? "bg-transparent" : "bg-blue-500")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={cn("truncate", m.read ? "font-medium" : "font-semibold")}>{m.name}</p>
                    <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(m.createdAt)}</span>
                  </div>
                  <p className="text-sm truncate">{m.subject || <span className="text-muted-foreground">(Konu yok)</span>}</p>
                  {!open && <p className="text-xs text-muted-foreground truncate mt-0.5">{m.message}</p>}
                </div>
                <ChevronDown className={cn("size-4 mt-1 text-muted-foreground transition-transform", open && "rotate-180")} />
              </button>
              {open && (
                <div className="px-4 pb-4 pl-9 flex flex-col gap-4">
                  <a href={`mailto:${m.email}`} className="text-xs text-muted-foreground hover:text-foreground w-fit">
                    {m.email}
                  </a>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild size="sm" className="gap-2 rounded-xl">
                      <a
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Mesajınız"}`)}`}
                      >
                        <Reply className="size-3.5" />
                        Yanıtla
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => setRead(m.id, false)}>
                      <MailOpen className="size-3.5" />
                      Okunmadı yap
                    </Button>
                    <ConfirmDeleteButton
                      endpoint={`/api/admin/messages/${m.id}`}
                      title="Mesaj silinsin mi?"
                      description={`${m.name} adlı kişinin mesajı kalıcı olarak silinecek.`}
                      label="Sil"
                      onDeleted={() => setMessages((prev) => prev.filter((x) => x.id !== m.id))}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground py-10 text-center">Okunmamış mesaj yok.</p>
        )}
      </div>
    </div>
  );
}
