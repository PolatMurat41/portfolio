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
import { TranslateButton } from "@/components/admin/translate-button";

export interface BlogFormValues {
  id?: string;
  slug: string;
  title: string;
  titleEn?: string | null;
  summary: string;
  summaryEn?: string | null;
  content: string;
  contentEn?: string | null;
  image: string;
  draft: boolean;
}

const emptyValues: BlogFormValues = {
  slug: "",
  title: "",
  titleEn: "",
  summary: "",
  summaryEn: "",
  content: "",
  contentEn: "",
  image: "",
  draft: true,
};

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
  const [values, setValues] = useState<BlogFormValues>({
    ...emptyValues,
    ...initialValues,
    titleEn: initialValues?.titleEn ?? "",
    summaryEn: initialValues?.summaryEn ?? "",
    contentEn: initialValues?.contentEn ?? "",
  });
  const [activePreviewLang, setActivePreviewLang] = useState<"tr" | "en">("tr");
  const [slugEdited, setSlugEdited] = useState(Boolean(initialValues));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleTitleChange(title: string) {
    setValues((prev) => ({
      ...prev,
      title,
      slug: slugEdited ? prev.slug : slugify(title),
    }));
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
      setError(
        body?.error === "Slug is already in use"
          ? body.error
          : "Kaydedilemedi. Lütfen zorunlu alanları kontrol edin."
      );
      return;
    }
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Titles */}
        <div className="border border-border rounded-xl p-4 bg-card/40 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Makale Başlığı</span>
            <TranslateButton
              textToTranslate={values.title}
              onTranslated={(text) => setValues((v) => ({ ...v, titleEn: text }))}
              label="Başlığı Çevir"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Başlık (Türkçe) *</Label>
              <Input
                id="title"
                value={values.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titleEn">Başlık (İngilizce - Opsiyonel)</Label>
              <Input
                id="titleEn"
                placeholder="Boş bırakılırsa Türkçe başlık kullanılır"
                value={values.titleEn ?? ""}
                onChange={(e) => setValues({ ...values, titleEn: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug (URL uzantısı) *</Label>
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

        {/* Summary */}
        <div className="border border-border rounded-xl p-4 bg-card/40 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Makale Özeti</span>
            <TranslateButton
              textToTranslate={values.summary}
              onTranslated={(text) => setValues((v) => ({ ...v, summaryEn: text }))}
              label="Özeti Çevir"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="summary">Özet (Türkçe) *</Label>
              <Textarea
                id="summary"
                rows={3}
                value={values.summary}
                onChange={(e) => setValues({ ...values, summary: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="summaryEn">Özet (İngilizce - Opsiyonel)</Label>
              <Textarea
                id="summaryEn"
                rows={3}
                placeholder="Boş bırakılırsa Türkçe özet kullanılır"
                value={values.summaryEn ?? ""}
                onChange={(e) => setValues({ ...values, summaryEn: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="image">Kapak Görseli URL (Opsiyonel)</Label>
          <Input
            id="image"
            value={values.image}
            onChange={(e) => setValues({ ...values, image: e.target.value })}
          />
        </div>

        {/* Content */}
        <div className="border border-border rounded-xl p-4 bg-card/40 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Makale İçeriği (Markdown)</span>
            <TranslateButton
              textToTranslate={values.content}
              onTranslated={(text) => setValues((v) => ({ ...v, contentEn: text }))}
              label="İçeriği Çevir (TR -> EN)"
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="content">İçerik (Türkçe - Markdown) *</Label>
              <Textarea
                id="content"
                rows={15}
                className="font-mono text-xs"
                value={values.content}
                onChange={(e) => setValues({ ...values, content: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contentEn">İçerik (İngilizce - Markdown / Opsiyonel)</Label>
              <Textarea
                id="contentEn"
                rows={15}
                className="font-mono text-xs"
                placeholder="Boş bırakılırsa Türkçe içerik kullanılır veya yukarıdaki 'İçeriği Çevir' butonunu kullanabilirsiniz"
                value={values.contentEn ?? ""}
                onChange={(e) => setValues({ ...values, contentEn: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="draft"
            checked={values.draft}
            onChange={(checked) => setValues({ ...values, draft: checked })}
          />
          <Label htmlFor="draft">Taslak olarak kaydet (sitede yayınlama)</Label>
        </div>

        <Button type="submit" disabled={submitting} className="w-fit">
          {submitting ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>

      {/* Live Preview Pane */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold text-sm">Canlı Önizleme</Label>
          <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted">
            <button
              type="button"
              onClick={() => setActivePreviewLang("tr")}
              className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors ${
                activePreviewLang === "tr"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Türkçe
            </button>
            <button
              type="button"
              onClick={() => setActivePreviewLang("en")}
              className={`px-2 py-0.5 text-xs rounded-md font-medium transition-colors ${
                activePreviewLang === "en"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              English
            </button>
          </div>
        </div>
        <div className="border border-border rounded-lg p-5 prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert overflow-y-auto max-h-[80vh] bg-card/60">
          <h2 className="text-xl font-bold text-foreground mb-2">
            {activePreviewLang === "en"
              ? values.titleEn || values.title || "Untitled"
              : values.title || "Başlıksız"}
          </h2>
          <p className="text-xs text-muted-foreground italic mb-4">
            {activePreviewLang === "en"
              ? values.summaryEn || values.summary
              : values.summary}
          </p>
          <hr className="my-3 border-border" />
          <Markdown
            remarkPlugins={[remarkGfm, remarkCodeMeta]}
            rehypePlugins={[rehypeRaw]}
            components={mdxComponents}
          >
            {(activePreviewLang === "en" ? values.contentEn || values.content : values.content) ||
              "*İçerik önizlemesi burada görünecektir.*"}
          </Markdown>
        </div>
      </div>
    </form>
  );
}
