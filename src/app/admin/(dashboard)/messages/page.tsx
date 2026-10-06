import { prisma } from "@/lib/prisma";
import { ensureSchema } from "@/lib/schema-sync";
import { MessagesInbox } from "@/components/admin/messages-inbox";
import { Inbox } from "lucide-react";

export default async function MessagesPage() {
  await ensureSchema();
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl">
      <div className="pb-6 border-b border-border">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
          <Inbox className="size-7" />
          Mesajlar
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Sitedeki iletişim formundan gelen mesajlar.</p>
      </div>
      <MessagesInbox
        initialMessages={messages.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          subject: m.subject,
          message: m.message,
          read: m.read,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
