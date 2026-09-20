"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { TranslateButton } from "@/components/admin/translate-button";

export interface ProfileFormValues {
  name: string;
  initials: string;
  url: string;
  location: string;
  locationLink: string;
  description: string;
  descriptionEn?: string | null;
  summary: string;
  summaryEn?: string | null;
  avatarUrl: string;
  email: string;
  tel: string;
}

export interface SocialLinkFormValue {
  platform: "GitHub" | "LinkedIn" | "X" | "Youtube" | "Email";
  url: string;
  showInNavbar: boolean;
}

export function ProfileForm({
  initialProfile,
  initialSocial,
}: {
  initialProfile: ProfileFormValues;
  initialSocial: SocialLinkFormValue[];
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileFormValues>({
    ...initialProfile,
    descriptionEn: initialProfile.descriptionEn ?? "",
    summaryEn: initialProfile.summaryEn ?? "",
  });
  const [social, setSocial] = useState(initialSocial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateSocial(platform: string, patch: Partial<SocialLinkFormValue>) {
    setSocial((prev) =>
      prev.map((link) => (link.platform === platform ? { ...link, ...patch } : link))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, social }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Kaydedilemedi. Lütfen zorunlu alanları kontrol edin.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-2xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-emerald-600 font-medium">Başarıyla kaydedildi.</p>}

      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold border-b pb-2">Profil Bilgileri</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Ad Soyad *</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="initials">Baş Harfler *</Label>
            <Input
              id="initials"
              value={profile.initials}
              onChange={(e) => setProfile({ ...profile, initials: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="url">Site URL *</Label>
          <Input
            id="url"
            type="url"
            value={profile.url}
            onChange={(e) => setProfile({ ...profile, url: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Konum *</Label>
            <Input
              id="location"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="locationLink">Konum Harita Linki *</Label>
            <Input
              id="locationLink"
              type="url"
              value={profile.locationLink}
              onChange={(e) => setProfile({ ...profile, locationLink: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Short Description (Hero Subtitle) */}
        <div className="border border-border rounded-xl p-4 bg-card/40 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Unvan / Kısa Açıklama (Hero Alt Başlığı)</span>
            <TranslateButton
              textToTranslate={profile.description}
              onTranslated={(text) => setProfile((p) => ({ ...p, descriptionEn: text }))}
              label="İngilizceye Çevir"
            />
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Kısa Açıklama (Türkçe) *</Label>
              <Textarea
                id="description"
                rows={2}
                value={profile.description}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="descriptionEn">Kısa Açıklama (İngilizce - Opsiyonel)</Label>
              <Textarea
                id="descriptionEn"
                rows={2}
                placeholder="Boş bırakılırsa Türkçe metin kullanılır"
                value={profile.descriptionEn ?? ""}
                onChange={(e) => setProfile({ ...profile, descriptionEn: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* About Summary */}
        <div className="border border-border rounded-xl p-4 bg-card/40 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Hakkımda / Biyografi Özeti</span>
            <TranslateButton
              textToTranslate={profile.summary}
              onTranslated={(text) => setProfile((p) => ({ ...p, summaryEn: text }))}
              label="İngilizceye Çevir"
            />
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="summary">Hakkımda Metni (Türkçe - Markdown) *</Label>
              <Textarea
                id="summary"
                rows={6}
                value={profile.summary}
                onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="summaryEn">Hakkımda Metni (İngilizce - Markdown / Opsiyonel)</Label>
              <Textarea
                id="summaryEn"
                rows={6}
                placeholder="Boş bırakılırsa Türkçe özet kullanılır veya yukarıdaki 'İngilizceye Çevir' butonuna basabilirsiniz"
                value={profile.summaryEn ?? ""}
                onChange={(e) => setProfile({ ...profile, summaryEn: e.target.value })}
              />
            </div>
          </div>
        </div>

        <ImageUploadField
          id="avatarUrl"
          label="Profil Fotoğrafı"
          value={profile.avatarUrl}
          onChange={(avatarUrl) => setProfile({ ...profile, avatarUrl })}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-posta *</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tel">Telefon *</Label>
            <Input
              id="tel"
              value={profile.tel}
              onChange={(e) => setProfile({ ...profile, tel: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold border-b pb-2">Sosyal Bağlantılar</h2>
        {social.map((link) => (
          <div key={link.platform} className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor={`social-${link.platform}`}>{link.platform}</Label>
              <Input
                id={`social-${link.platform}`}
                value={link.url}
                onChange={(e) => updateSocial(link.platform, { url: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id={`navbar-${link.platform}`}
                checked={link.showInNavbar}
                onChange={(checked) => updateSocial(link.platform, { showInNavbar: checked })}
              />
              <Label htmlFor={`navbar-${link.platform}`}>Navbarda göster</Label>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Kaydediliyor..." : "Kaydet"}
      </Button>
    </form>
  );
}
