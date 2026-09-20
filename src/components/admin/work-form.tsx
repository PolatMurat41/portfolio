"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TranslateButton } from "@/components/admin/translate-button";

export interface WorkFormValues {
  id?: string;
  company: string;
  href: string;
  location: string;
  title: string;
  titleEn?: string | null;
  logoUrl: string;
  start: string;
  end: string;
  description: string;
  descriptionEn?: string | null;
  badges: string[];
}

const emptyValues: WorkFormValues = {
  company: "",
  href: "",
  location: "",
  title: "",
  titleEn: "",
  logoUrl: "",
  start: "",
  end: "",
  description: "",
  descriptionEn: "",
  badges: [],
};

export function WorkForm({ initialValues }: { initialValues?: WorkFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<WorkFormValues>({
    ...emptyValues,
    ...initialValues,
    titleEn: initialValues?.titleEn ?? "",
    descriptionEn: initialValues?.descriptionEn ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const res = await fetch(isEdit ? `/api/admin/work/${values.id}` : "/api/admin/work", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Kaydedilemedi. Lütfen zorunlu alanları kontrol edin.");
      return;
    }
    router.push("/admin/work");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="company">Şirket Adı *</Label>
          <Input
            id="company"
            value={values.company}
            onChange={(e) => setValues({ ...values, company: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="href">Şirket Web Sitesi *</Label>
          <Input
            id="href"
            type="url"
            value={values.href}
            onChange={(e) => setValues({ ...values, href: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Titles */}
      <div className="border border-border rounded-xl p-4 bg-card/40 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">Pozisyon / Görev Unvanı</span>
          <TranslateButton
            textToTranslate={values.title}
            onTranslated={(text) => setValues((v) => ({ ...v, titleEn: text }))}
            label="Unvanı Çevir"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Pozisyon (Türkçe) *</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => setValues({ ...values, title: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="titleEn">Pozisyon (İngilizce - Opsiyonel)</Label>
            <Input
              id="titleEn"
              placeholder="Boş bırakılırsa Türkçe unvan kullanılır"
              value={values.titleEn ?? ""}
              onChange={(e) => setValues({ ...values, titleEn: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Konum *</Label>
          <Input
            id="location"
            value={values.location}
            onChange={(e) => setValues({ ...values, location: e.target.value })}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="logoUrl">Şirket Logo URL *</Label>
          <Input
            id="logoUrl"
            value={values.logoUrl}
            onChange={(e) => setValues({ ...values, logoUrl: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start">Başlangıç Tarihi *</Label>
          <Input
            id="start"
            value={values.start}
            onChange={(e) => setValues({ ...values, start: e.target.value })}
            required
            placeholder="Ocak 2023"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end">Bitiş Tarihi *</Label>
          <Input
            id="end"
            value={values.end}
            onChange={(e) => setValues({ ...values, end: e.target.value })}
            required
            placeholder="Present veya Devam Ediyor"
          />
        </div>
      </div>

      {/* Description */}
      <div className="border border-border rounded-xl p-4 bg-card/40 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">İş / Görev Açıklaması</span>
          <TranslateButton
            textToTranslate={values.description}
            onTranslated={(text) => setValues((v) => ({ ...v, descriptionEn: text }))}
            label="Açıklamayı Çevir"
          />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Açıklama (Türkçe - Markdown) *</Label>
            <Textarea
              id="description"
              rows={5}
              value={values.description}
              onChange={(e) => setValues({ ...values, description: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descriptionEn">Açıklama (İngilizce - Markdown / Opsiyonel)</Label>
            <Textarea
              id="descriptionEn"
              rows={5}
              placeholder="Boş bırakılırsa Türkçe açıklama kullanılır veya yukarıdaki 'Açıklamayı Çevir' butonuna basabilirsiniz"
              value={values.descriptionEn ?? ""}
              onChange={(e) => setValues({ ...values, descriptionEn: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="badges">Rozetler / Teknolojiler (virgülle ayırın)</Label>
        <Input
          id="badges"
          value={values.badges.join(", ")}
          onChange={(e) =>
            setValues({
              ...values,
              badges: e.target.value
                .split(",")
                .map((b) => b.trim())
                .filter(Boolean),
            })
          }
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
