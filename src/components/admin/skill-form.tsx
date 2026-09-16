"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconSelect } from "@/components/ui/icon-select";
import type { IconKey } from "@/lib/icon-registry";

export interface SkillFormValues {
  id?: string;
  name: string;
  iconKey: string;
}

const emptyValues: SkillFormValues = { name: "", iconKey: "globe" };

export function SkillForm({ initialValues }: { initialValues?: SkillFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<SkillFormValues>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const res = await fetch(isEdit ? `/api/admin/skills/${values.id}` : "/api/admin/skills", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/skills");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="iconKey">Icon</Label>
        <IconSelect value={values.iconKey} onChange={(iconKey: IconKey) => setValues({ ...values, iconKey })} />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
