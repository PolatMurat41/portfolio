"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface WorkFormValues {
  id?: string;
  company: string;
  href: string;
  location: string;
  title: string;
  logoUrl: string;
  start: string;
  end: string;
  description: string;
  badges: string[];
}

const emptyValues: WorkFormValues = {
  company: "",
  href: "",
  location: "",
  title: "",
  logoUrl: "",
  start: "",
  end: "",
  description: "",
  badges: [],
};

export function WorkForm({ initialValues }: { initialValues?: WorkFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<WorkFormValues>(initialValues ?? emptyValues);
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
      setError("Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/work");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="company">Company</Label>
        <Input id="company" value={values.company} onChange={(e) => setValues({ ...values, company: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="href">Company URL</Label>
        <Input id="href" type="url" value={values.href} onChange={(e) => setValues({ ...values, href: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Location</Label>
        <Input id="location" value={values.location} onChange={(e) => setValues({ ...values, location: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input id="logoUrl" value={values.logoUrl} onChange={(e) => setValues({ ...values, logoUrl: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start">Start</Label>
          <Input id="start" value={values.start} onChange={(e) => setValues({ ...values, start: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end">End</Label>
          <Input id="end" value={values.end} onChange={(e) => setValues({ ...values, end: e.target.value })} required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={5} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="badges">Badges (comma-separated)</Label>
        <Input
          id="badges"
          value={values.badges.join(", ")}
          onChange={(e) =>
            setValues({ ...values, badges: e.target.value.split(",").map((b) => b.trim()).filter(Boolean) })
          }
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
