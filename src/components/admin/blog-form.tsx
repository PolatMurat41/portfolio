"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { remarkCodeMeta } from "@/lib/remark-code-meta";
import { mdxComponents } from "@/mdx-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export interface BlogFormValues {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  draft: boolean;
}

const emptyValues: BlogFormValues = { slug: "", title: "", summary: "", content: "", image: "", draft: true };

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function BlogForm({ initialValues }: { initialValues?: BlogFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<BlogFormValues>(initialValues ?? emptyValues);
  const [slugEdited, setSlugEdited] = useState(Boolean(initialValues));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleTitleChange(title: string) {
    setValues((prev) => ({ ...prev, title, slug: slugEdited ? prev.slug : slugify(title) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const res = await fetch(isEdit ? `/api/admin/blog/${values.id}` : "/api/admin/blog", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error === "Slug is already in use" ? body.error : "Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={values.title} onChange={(e) => handleTitleChange(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={values.slug}
            onChange={(e) => {
              setSlugEdited(true);
              setValues({ ...values, slug: e.target.value });
            }}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="summary">Summary</Label>
          <Textarea id="summary" rows={3} value={values.summary} onChange={(e) => setValues({ ...values, summary: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="image">Cover Image URL</Label>
          <Input id="image" value={values.image} onChange={(e) => setValues({ ...values, image: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="content">Content (Markdown)</Label>
          <Textarea
            id="content"
            rows={20}
            className="font-mono text-xs"
            value={values.content}
            onChange={(e) => setValues({ ...values, content: e.target.value })}
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="draft" checked={values.draft} onChange={(checked) => setValues({ ...values, draft: checked })} />
          <Label htmlFor="draft">Draft (do not publish)</Label>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Preview</Label>
        <div className="border border-border rounded-lg p-4 prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert overflow-y-auto max-h-[80vh]">
          <Markdown remarkPlugins={[remarkGfm, remarkCodeMeta]} rehypePlugins={[rehypeRaw]} components={mdxComponents}>
            {values.content || "*Content preview will appear here*"}
          </Markdown>
        </div>
      </div>
    </form>
  );
}
