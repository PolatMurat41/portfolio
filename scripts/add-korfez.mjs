import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // First, shift sortOrder of Endüstriyel Süt Tedarik and Adiatank
  const endustriyel = await prisma.project.findFirst({
    where: { title: { contains: "Endüstriyel Süt" } },
  });
  if (endustriyel) {
    await prisma.project.update({
      where: { id: endustriyel.id },
      data: { sortOrder: 5 },
    });
    console.log("Updated Endüstriyel Süt Tedarik sortOrder to 5");
  }

  const adiatank = await prisma.project.findFirst({
    where: { title: { contains: "Adiatank" } },
  });
  if (adiatank) {
    await prisma.project.update({
      where: { id: adiatank.id },
      data: { sortOrder: 6 },
    });
    console.log("Updated Adiatank sortOrder to 6");
  }

  // Now create or update Körfez Kuyumculuk
  const existing = await prisma.project.findFirst({
    where: { href: "https://korfezkuyumculuk.com/" },
  });

  const projectData = {
    title: "Körfez Kuyumculuk",
    href: "https://korfezkuyumculuk.com/",
    dates: "Completed",
    active: false,
    description:
      "Karamürsel Körfez Kuyumculuk için geliştirilen, özel takı ve mücevher koleksiyonları ile anlık canlı altın fiyatlarını sunan lüks kurumsal ve vitrin platformu.",
    technologies: ["Next.js", "React", "Tailwind CSS", "Node.js"],
    image: "/projects/korfez-kuyumculuk.png",
    video: "",
    links: [
      {
        href: "https://korfezkuyumculuk.com/",
        type: "Website",
        iconKey: "globe",
      },
    ],
    sortOrder: 4,
  };

  if (existing) {
    await prisma.project.update({
      where: { id: existing.id },
      data: projectData,
    });
    console.log("Updated Körfez Kuyumculuk at position 5 (sortOrder 4)");
  } else {
    await prisma.project.create({
      data: projectData,
    });
    console.log("Created Körfez Kuyumculuk at position 5 (sortOrder 4)");
  }

  const allProjects = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
  console.log("Current projects list:");
  allProjects.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.title} (sortOrder: ${p.sortOrder})`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
