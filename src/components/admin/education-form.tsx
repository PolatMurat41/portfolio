"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface EducationFormValues {
  id?: string;
  school: string;
  href: string;
  degree: string;
  logoUrl: string;
  start: string;
  end: string;
}

const emptyValues: EducationFormValues = { school: "", href: "", degree: "", logoUrl: "", start: "", end: "" };

export function EducationForm({ initialValues }: { initialValues?: EducationFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<EducationFormValues>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const res = await fetch(isEdit ? `/api/admin/education/${values.id}` : "/api/admin/education", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/education");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="school">School</Label>
        <Input id="school" value={values.school} onChange={(e) => setValues({ ...values, school: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="degree">Degree</Label>
        <Input id="degree" value={values.degree} onChange={(e) => setValues({ ...values, degree: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="href">School URL</Label>
        <Input id="href" type="url" value={values.href} onChange={(e) => setValues({ ...values, href: e.target.value })} required />
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
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
