import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const profile = await prisma.profile.findMany();
  console.log("=== PROFILE ===");
  console.log(profile);

  const projects = await prisma.project.findMany();
  console.log("=== PROJECTS ===");
  console.log(JSON.stringify(projects, null, 2));

  const blogs = await prisma.blogPost.findMany();
  console.log("=== BLOGS ===");
  console.log(JSON.stringify(blogs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
