import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ensureSchema } from "@/lib/schema-sync";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { ArrowLeft, MessagesSquare } from "lucide-react";

const PAGE_SIZE = 50;

function formatDate(date: Date) {
  return date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });
}

export default async function ConversationsPage() {
  await ensureSchema();
  const conversations = await prisma.chatConversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: PAGE_SIZE,
    include: {
      _count: { select: { messages: true } },
      messages: { where: { role: "user" }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      <Link href="/admin/chatbot" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 w-fit">
        <ArrowLeft className="size-4" />
        AI Chatbot
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <MessagesSquare className="size-6" />
            Konuşma Kayıtları
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ziyaretçilerin asistana sorduğu sorular. Son {PAGE_SIZE} konuşma gösterilir.
          </p>
        </div>
        {conversations.length > 0 && (
          <ConfirmDeleteButton
            endpoint="/api/admin/chatbot/conversations"
            title="Tüm konuşmalar silinsin mi?"
            description="Tüm konuşma kayıtları kalıcı olarak silinecek. Bu işlem geri alınamaz."
            label="Tümünü sil"
          />
        )}
      </div>

      {conversations.length === 0 ? (
        <p className="text-sm text-muted-foreground py-16 text-center border border-dashed rounded-2xl">
          Henüz konuşma yok.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((c) => (
            <div key={c.id} className="flex items-center gap-3 border border-border rounded-xl p-4 bg-card/60 hover:border-foreground/20 transition-colors">
              <Link href={`/admin/chatbot/conversations/${c.id}`} className="flex-1 min-w-0">
                <p className="font-medium truncate">{c.messages[0]?.content ?? "—"}</p>
                <p className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                  <span>{formatDate(c.updatedAt)}</span>
                  <span>{c._count.messages} mesaj</span>
                  <span className="uppercase">{c.language}</span>
                </p>
              </Link>
              <ConfirmDeleteButton
                endpoint={`/api/admin/chatbot/conversations/${c.id}`}
                title="Konuşma silinsin mi?"
                description="Bu konuşma kalıcı olarak silinecek."
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
