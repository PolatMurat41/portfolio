import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SkillForm } from "@/components/admin/skill-form";

export default async function EditSkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Skill</h1>
      <SkillForm initialValues={skill} />
    </div>
  );
}
