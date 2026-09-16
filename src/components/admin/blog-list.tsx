"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
import { Trash2, Pencil } from "lucide-react";

interface BlogListItem {
  id: string;
  slug: string;
  title: string;
  draft: boolean;
}

export function BlogList({ posts: initialPosts }: { posts: BlogListItem[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setPendingId(id);
    setError(null);
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setPendingId(null);
    if (!res.ok) {
      setError("Could not delete this post.");
      return;
    }
    setPosts((prev) => prev.filter((post) => post.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {posts.map((post) => (
        <div key={post.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{post.title}</span>
              {post.draft && <Badge variant="outline">Draft</Badge>}
            </div>
            <span className="text-xs text-muted-foreground">/{post.slug}</span>
          </div>
          <Link href={`/admin/blog/${post.id}`} className="text-muted-foreground hover:text-foreground" aria-label="Edit">
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
                <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                <AlertDialogDescription>&quot;{post.title}&quot; will be permanently deleted. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={pendingId === post.id} onClick={() => handleDelete(post.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
      {posts.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No posts yet.</p>}
    </div>
  );
}
