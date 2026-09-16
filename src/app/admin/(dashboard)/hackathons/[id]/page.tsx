import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HackathonForm } from "@/components/admin/hackathon-form";

export default async function EditHackathonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hackathon = await prisma.hackathon.findUnique({ where: { id } });
  if (!hackathon) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Hackathon</h1>
      <HackathonForm
        initialValues={{
          id: hackathon.id,
          title: hackathon.title,
          dates: hackathon.dates,
          location: hackathon.location,
          description: hackathon.description,
          image: hackathon.image,
          mlh: hackathon.mlh ?? "",
          win: hackathon.win ?? "",
          links: hackathon.links as { title: string; href: string; iconKey: string }[],
        }}
      />
    </div>
  );
}
