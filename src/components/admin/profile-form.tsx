"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploadField } from "@/components/admin/image-upload-field";

export interface ProfileFormValues {
  name: string;
  initials: string;
  url: string;
  location: string;
  locationLink: string;
  description: string;
  summary: string;
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
  const [profile, setProfile] = useState(initialProfile);
  const [social, setSocial] = useState(initialSocial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateSocial(platform: string, patch: Partial<SocialLinkFormValue>) {
    setSocial((prev) => prev.map((link) => (link.platform === platform ? { ...link, ...patch } : link)));
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
      setError("Could not save. Check the required fields.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-2xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-muted-foreground">Saved.</p>}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="initials">Initials</Label>
            <Input id="initials" value={profile.initials} onChange={(e) => setProfile({ ...profile, initials: e.target.value })} required />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="url">Site URL</Label>
          <Input id="url" type="url" value={profile.url} onChange={(e) => setProfile({ ...profile, url: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="locationLink">Location Link</Label>
            <Input id="locationLink" type="url" value={profile.locationLink} onChange={(e) => setProfile({ ...profile, locationLink: e.target.value })} required />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Short Description (hero subtitle)</Label>
          <Textarea id="description" rows={2} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="summary">About Summary (Markdown)</Label>
          <Textarea id="summary" rows={6} value={profile.summary} onChange={(e) => setProfile({ ...profile, summary: e.target.value })} required />
        </div>
        <ImageUploadField
          id="avatarUrl"
          label="Avatar"
          value={profile.avatarUrl}
          onChange={(avatarUrl) => setProfile({ ...profile, avatarUrl })}
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tel">Phone</Label>
            <Input id="tel" value={profile.tel} onChange={(e) => setProfile({ ...profile, tel: e.target.value })} required />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Social Links</h2>
        {social.map((link) => (
          <div key={link.platform} className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor={`social-${link.platform}`}>{link.platform}</Label>
              <Input id={`social-${link.platform}`} value={link.url} onChange={(e) => updateSocial(link.platform, { url: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id={`navbar-${link.platform}`}
                checked={link.showInNavbar}
                onChange={(checked) => updateSocial(link.platform, { showInNavbar: checked })}
              />
              <Label htmlFor={`navbar-${link.platform}`}>Show in navbar</Label>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
