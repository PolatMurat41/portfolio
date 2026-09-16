"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SortableListItem {
  id: string;
}

interface SortableListProps<T extends SortableListItem> {
  items: T[];
  basePath: string;
  apiPath: string;
  renderItem: (item: T) => React.ReactNode;
  renderLabel: (item: T) => string;
}

export function SortableList<T extends SortableListItem>({
  items: initialItems,
  basePath,
  apiPath,
  renderItem,
  renderLabel,
}: SortableListProps<T>) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function persistOrder(next: T[]) {
    const previous = items;
    setItems(next);
    setError(null);
    const res = await fetch(`${apiPath}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((item) => item.id) }),
    });
    if (!res.ok) {
      setItems(previous);
      setError("Could not save the new order.");
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    void persistOrder(next);
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    setError(null);
    const res = await fetch(`${apiPath}/${id}`, { method: "DELETE" });
    setPendingId(null);
    if (!res.ok) {
      setError("Could not delete this item.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} item(s)</p>
        <Button asChild size="sm">
          <Link href={`${basePath}/new`}>
            <Plus className="size-4" /> Add New
          </Link>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
            <div className="flex flex-col">
              <button type="button" aria-label="Move up" className="disabled:opacity-30" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUp className="size-4" />
              </button>
              <button type="button" aria-label="Move down" className="disabled:opacity-30" disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                <ArrowDown className="size-4" />
              </button>
            </div>
            <div className="flex-1 min-w-0">{renderItem(item)}</div>
            <Link href={`${basePath}/${item.id}`} className="text-muted-foreground hover:text-foreground" aria-label="Edit">
              <Pencil className="size-4" />
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-destructive" aria-label="Delete">
                  <Trash2 className="size-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{renderLabel(item)}&quot; will be permanently deleted. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={pendingId === item.id} onClick={() => handleDelete(item.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No items yet.</p>}
      </div>
    </div>
  );
}
