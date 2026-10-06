import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureSchema } from "@/lib/schema-sync";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { ArrowLeft } from "lucide-react";

function formatDate(date: Date) {
  return date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" });
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await ensureSchema();
  const conversation = await prisma.chatConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) notFound();

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl">
      <Link
        href="/admin/chatbot/conversations"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 w-fit"
      >
        <ArrowLeft className="size-4" />
        Konuşma Kayıtları
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Konuşma detayı</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Başlangıç: {formatDate(conversation.createdAt)} · {conversation.messages.length} mesaj · Dil:{" "}
            {conversation.language.toUpperCase()}
          </p>
        </div>
        <ConfirmDeleteButton
          endpoint={`/api/admin/chatbot/conversations/${conversation.id}`}
          title="Konuşma silinsin mi?"
          description="Bu konuşma kalıcı olarak silinecek."
          label="Sil"
          redirectTo="/admin/chatbot/conversations"
        />
      </div>

      <div className="flex flex-col gap-4">
        {conversation.messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex flex-col items-end gap-1">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {m.content}
              </div>
              <span className="text-[10px] text-muted-foreground">{formatDate(m.createdAt)}</span>
            </div>
          ) : (
            <div key={m.id} className="flex flex-col items-start gap-1">
              <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-muted px-4 py-2.5">
                <ChatMarkdown content={m.content} />
              </div>
              <span className="text-[10px] text-muted-foreground">{formatDate(m.createdAt)}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
