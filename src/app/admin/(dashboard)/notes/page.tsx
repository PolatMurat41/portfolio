import { prisma } from "@/lib/prisma";
import { ensureSchema } from "@/lib/schema-sync";
import { NotesBoard } from "@/components/admin/notes-board";
import { Lock, NotebookPen } from "lucide-react";

export default async function NotesPage() {
  await ensureSchema();
  const notes = await prisma.note.findMany({ orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }] });

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="pb-6 border-b border-border">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2.5">
          <NotebookPen className="size-7" />
          Özel Notlar
        </h1>
        <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
          <Lock className="size-3.5" />
          Sadece sen görebilirsin. Sitede ve chatbot&apos;ta hiçbir zaman görünmez.
        </p>
      </div>
      <NotesBoard
        initialNotes={notes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          pinned: n.pinned,
          updatedAt: n.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
