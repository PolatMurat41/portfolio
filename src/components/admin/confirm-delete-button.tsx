"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function ConfirmDeleteButton({
  endpoint,
  title,
  description,
  label,
  redirectTo,
  onDeleted,
}: {
  endpoint: string;
  title: string;
  description: string;
  /** Shows a labelled button instead of an icon. */
  label?: string;
  redirectTo?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const res = await fetch(endpoint, { method: "DELETE" });
    setPending(false);
    if (!res.ok) return;
    onDeleted?.();
    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {label ? (
          <Button type="button" variant="outline" size="sm" className="gap-2 rounded-xl text-destructive hover:text-destructive">
            <Trash2 className="size-3.5" />
            {label}
          </Button>
        ) : (
          <button type="button" className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Sil">
            <Trash2 className="size-4" />
          </button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={handleDelete}>
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
