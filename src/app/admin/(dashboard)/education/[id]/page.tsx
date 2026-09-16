import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EducationForm } from "@/components/admin/education-form";

export default async function EditEducationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const education = await prisma.education.findUnique({ where: { id } });
  if (!education) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Education</h1>
      <EducationForm initialValues={education} />
    </div>
  );
}
