"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { IconSelect } from "@/components/ui/icon-select";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { IconKey } from "@/lib/icon-registry";
import { Trash2, Plus } from "lucide-react";

export interface ProjectLinkValue {
  type: string;
  href: string;
  iconKey: string;
}

export interface ProjectFormValues {
  id?: string;
  title: string;
  href: string;
  dates: string;
  active: boolean;
  description: string;
  technologies: string[];
  image: string;
  video: string;
  links: ProjectLinkValue[];
}

const emptyValues: ProjectFormValues = {
  title: "",
  href: "",
  dates: "",
  active: false,
  description: "",
  technologies: [],
  image: "",
  video: "",
  links: [],
};

export function ProjectForm({ initialValues }: { initialValues?: ProjectFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<ProjectFormValues>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateLink(index: number, patch: Partial<ProjectLinkValue>) {
    setValues((prev) => ({ ...prev, links: prev.links.map((link, i) => (i === index ? { ...link, ...patch } : link)) }));
  }

  function addLink() {
    setValues((prev) => ({ ...prev, links: [...prev.links, { type: "Website", href: "", iconKey: "globe" }] }));
  }

  function removeLink(index: number) {
    setValues((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const res = await fetch(isEdit ? `/api/admin/projects/${values.id}` : "/api/admin/projects", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/projects");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="href">Project URL</Label>
        <Input id="href" type="url" value={values.href} onChange={(e) => setValues({ ...values, href: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dates">Dates</Label>
        <Input id="dates" value={values.dates} onChange={(e) => setValues({ ...values, dates: e.target.value })} required placeholder="Jan 2024 - Feb 2024" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="active" checked={values.active} onChange={(checked) => setValues({ ...values, active: checked })} />
        <Label htmlFor="active">Active</Label>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (Markdown)</Label>
        <Textarea id="description" rows={4} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="technologies">Technologies (comma-separated)</Label>
        <Input
          id="technologies"
          value={values.technologies.join(", ")}
          onChange={(e) => setValues({ ...values, technologies: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
        />
      </div>
      <ImageUploadField
        id="image"
        label="Image"
        value={values.image}
        onChange={(image) => setValues({ ...values, image })}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="video">Video URL</Label>
        <Input id="video" value={values.video} onChange={(e) => setValues({ ...values, video: e.target.value })} />
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
            <div className="flex flex-col gap-1.5 w-28">
              <Label htmlFor={`link-type-${index}`}>Label</Label>
              <Input id={`link-type-${index}`} value={link.type} onChange={(e) => updateLink(index, { type: e.target.value })} />
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
