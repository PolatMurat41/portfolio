"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconSelect } from "@/components/ui/icon-select";
import type { IconKey } from "@/lib/icon-registry";
import { Trash2, Plus } from "lucide-react";

export interface HackathonLinkValue {
  title: string;
  href: string;
  iconKey: string;
}

export interface HackathonFormValues {
  id?: string;
  title: string;
  dates: string;
  location: string;
  description: string;
  image: string;
  mlh: string;
  win: string;
  links: HackathonLinkValue[];
}

const emptyValues: HackathonFormValues = {
  title: "",
  dates: "",
  location: "",
  description: "",
  image: "",
  mlh: "",
  win: "",
  links: [],
};

export function HackathonForm({ initialValues }: { initialValues?: HackathonFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<HackathonFormValues>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateLink(index: number, patch: Partial<HackathonLinkValue>) {
    setValues((prev) => ({ ...prev, links: prev.links.map((link, i) => (i === index ? { ...link, ...patch } : link)) }));
  }

  function addLink() {
    setValues((prev) => ({ ...prev, links: [...prev.links, { title: "Source", href: "", iconKey: "github" }] }));
  }

  function removeLink(index: number) {
    setValues((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const payload = { ...values, mlh: values.mlh || null, win: values.win || null };
    const res = await fetch(isEdit ? `/api/admin/hackathons/${values.id}` : "/api/admin/hackathons", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/hackathons");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dates">Dates</Label>
          <Input id="dates" value={values.dates} onChange={(e) => setValues({ ...values, dates: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={values.location} onChange={(e) => setValues({ ...values, location: e.target.value })} required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (Markdown)</Label>
        <Textarea id="description" rows={4} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" value={values.image} onChange={(e) => setValues({ ...values, image: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mlh">MLH Badge URL (optional)</Label>
          <Input id="mlh" value={values.mlh} onChange={(e) => setValues({ ...values, mlh: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="win">Award (optional)</Label>
          <Input id="win" value={values.win} onChange={(e) => setValues({ ...values, win: e.target.value })} placeholder="1st Place Winner" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Links</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLink}>
            <Plus className="size-4" /> Add Link
          </Button>
        </div>
        {values.links.map((link, index) => (
          <div key={index} className="flex items-end gap-2 border border-border rounded-lg p-3">
            <div className="flex flex-col gap-1.5 w-32">
              <Label htmlFor={`link-title-${index}`}>Label</Label>
              <Input id={`link-title-${index}`} value={link.title} onChange={(e) => updateLink(index, { title: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor={`link-href-${index}`}>URL</Label>
              <Input id={`link-href-${index}`} value={link.href} onChange={(e) => updateLink(index, { href: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Icon</Label>
              <IconSelect value={link.iconKey} onChange={(iconKey: IconKey) => updateLink(index, { iconKey })} />
            </div>
            <button type="button" aria-label="Remove link" className="text-muted-foreground hover:text-destructive pb-2" onClick={() => removeLink(index)}>
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
