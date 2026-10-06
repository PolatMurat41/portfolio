"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Eye, Loader2, NotebookPen, Pencil, Pin, PinOff, Plus, Search, TriangleAlert } from "lucide-react";

interface NoteItem {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  updatedAt: string;
}

type SaveStatus = "saved" | "dirty" | "saving" | "error";

const AUTOSAVE_DELAY_MS = 700;

function formatDate(iso: string) {
  // Fixed time zone so the server render and the browser agree.
  return new Date(iso).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Istanbul",
  });
}

function snippet(content: string) {
  return content.replace(/[#*_`>\-[\]()!]/g, " ").replace(/\s+/g, " ").trim().slice(0, 90);
}

export function NotesBoard({ initialNotes }: { initialNotes: NoteItem[] }) {
  const [notes, setNotes] = useState(initialNotes);
  const [selectedId, setSelectedId] = useState<string | null>(initialNotes[0]?.id ?? null);
  const [mode, setMode] = useState<"edit" | "preview">(initialNotes[0]?.content ? "preview" : "edit");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [creating, setCreating] = useState(false);

  const notesRef = useRef(notes);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIdRef = useRef<string | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const sorted = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("tr");
    return [...notes]
      .filter(
        (n) =>
          !q || n.title.toLocaleLowerCase("tr").includes(q) || n.content.toLocaleLowerCase("tr").includes(q)
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [notes, query]);

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  // Saves run one after another so an older request can't overwrite a newer one.
  const save = useCallback((id: string) => {
    queueRef.current = queueRef.current.then(async () => {
      const note = notesRef.current.find((n) => n.id === id);
      if (!note) return;
      setStatus("saving");
      try {
        const res = await fetch(`/api/admin/notes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: note.title.trim() || "Başlıksız not",
            content: note.content,
            pinned: note.pinned,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const { updatedAt } = await res.json();
        setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, updatedAt } : n)));
        setStatus((current) => (current === "saving" ? "saved" : current));
      } catch {
        setStatus("error");
      }
    });
    return queueRef.current;
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current && pendingIdRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      void save(pendingIdRef.current);
    }
  }, [save]);

  function update(id: string, patch: Partial<NoteItem>, delay = AUTOSAVE_DELAY_MS) {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    setStatus("dirty");
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingIdRef.current = id;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void save(id);
    }, delay);
  }

  function select(id: string) {
    if (id === selectedId) return;
    flush();
    const note = notes.find((n) => n.id === id);
    setSelectedId(id);
    setMode(note?.content ? "preview" : "edit");
  }

  async function createNote() {
    flush();
    setCreating(true);
    const res = await fetch("/api/admin/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Yeni not", content: "", pinned: false }),
    });
    setCreating(false);
    if (!res.ok) {
      setStatus("error");
      return;
    }
    const created = await res.json();
    setNotes((prev) => [
      { id: created.id, title: created.title, content: created.content, pinned: created.pinned, updatedAt: created.updatedAt },
      ...prev,
    ]);
    setSelectedId(created.id);
    setMode("edit");
    setQuery("");
    setTimeout(() => titleRef.current?.select(), 50);
  }

  function removeNote(id: string) {
    if (pendingIdRef.current === id && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    setSelectedId(remaining[0]?.id ?? null);
    setMode(remaining[0]?.content ? "preview" : "edit");
    setStatus("saved");
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flush();
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (timerRef.current) {
        flush();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flush();
    };
  }, [flush]);

  const statusLabel = {
    saved: { icon: <Check className="size-3.5 text-emerald-500" />, text: "Kaydedildi" },
    dirty: { icon: <Pencil className="size-3.5" />, text: "Düzenleniyor…" },
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Kaydediliyor…" },
    error: { icon: <TriangleAlert className="size-3.5 text-destructive" />, text: "Kaydedilemedi — Ctrl+S ile tekrar dene" },
  }[status];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">
      {/* List */}
      <div className="flex flex-col gap-3 lg:sticky lg:top-6">
        <Button onClick={createNote} disabled={creating} className="gap-2 rounded-xl">
          {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Yeni Not
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Notlarda ara..."
            className="w-full h-9 rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1.5 max-h-[calc(100dvh-16rem)] overflow-y-auto pr-1">
          {sorted.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => select(note.id)}
              className={cn(
                "text-left rounded-xl border p-3 transition-colors",
                note.id === selectedId
                  ? "border-foreground/30 bg-card ring-2 ring-foreground/10"
                  : "bg-card/60 hover:border-foreground/20"
              )}
            >
              <div className="flex items-center gap-1.5">
                {note.pinned && <Pin className="size-3 shrink-0 text-amber-500" />}
                <p className="text-sm font-medium truncate">{note.title || "Başlıksız not"}</p>
              </div>
              {note.content && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{snippet(note.content)}</p>}
              <p className="text-[10px] text-muted-foreground mt-1.5">{formatDate(note.updatedAt)}</p>
            </button>
          ))}
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {notes.length === 0 ? "Henüz not yok." : "Eşleşen not yok."}
            </p>
          )}
        </div>
      </div>

      {/* Editor */}
      {selected ? (
        <div className="border border-border rounded-2xl bg-card/60 flex flex-col min-h-[560px]">
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground mr-auto">
              {statusLabel.icon}
              {statusLabel.text}
            </span>
            <div className="flex rounded-lg bg-muted p-0.5 text-xs font-medium">
              {(
                [
                  ["edit", "Düzenle", Pencil],
                  ["preview", "Önizle", Eye],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md",
                    mode === key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg"
              onClick={() => update(selected.id, { pinned: !selected.pinned }, 0)}
            >
              {selected.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
              {selected.pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
            </Button>
            <ConfirmDeleteButton
              endpoint={`/api/admin/notes/${selected.id}`}
              title="Not silinsin mi?"
              description={`"${selected.title || "Başlıksız not"}" kalıcı olarak silinecek.`}
              onDeleted={() => removeNote(selected.id)}
            />
          </div>

          <div className="flex flex-col gap-4 p-5 md:p-7 flex-1">
            <input
              ref={titleRef}
              value={selected.title}
              onChange={(e) => update(selected.id, { title: e.target.value.slice(0, 200) })}
              placeholder="Başlık"
              className="w-full bg-transparent text-xl md:text-2xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/60"
            />
            {mode === "edit" ? (
              <textarea
                value={selected.content}
                onChange={(e) => update(selected.id, { content: e.target.value })}
                placeholder="Notunu yaz... Markdown desteklenir: **kalın**, - liste, - [ ] yapılacak, ## başlık"
                className="flex-1 min-h-[420px] w-full resize-y bg-transparent text-sm leading-relaxed font-mono outline-none placeholder:text-muted-foreground/60"
                autoFocus={!selected.content}
              />
            ) : selected.content ? (
              <ChatMarkdown content={selected.content} className="text-[15px] leading-relaxed" />
            ) : (
              <button
                type="button"
                onClick={() => setMode("edit")}
                className="text-sm text-muted-foreground text-left hover:text-foreground"
              >
                Bu not boş. Yazmaya başlamak için tıkla.
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 min-h-[400px] text-center p-8">
          <NotebookPen className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Bir not seç ya da yeni bir not oluştur.</p>
        </div>
      )}
    </div>
  );
}
