import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkForm } from "@/components/admin/work-form";

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await prisma.workExperience.findUnique({ where: { id } });
  if (!work) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Work Experience</h1>
      <WorkForm initialValues={work} />
    </div>
  );
}
