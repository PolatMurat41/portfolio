import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/admin/project-form";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Project</h1>
      <ProjectForm
        initialValues={{
          id: project.id,
          title: project.title,
          href: project.href,
          dates: project.dates,
          active: project.active,
          description: project.description,
          technologies: project.technologies,
          image: project.image,
          video: project.video,
          links: project.links as { type: string; href: string; iconKey: string }[],
        }}
      />
    </div>
  );
}
