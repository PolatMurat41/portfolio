import { prisma } from "@/lib/prisma";

export async function getProfile() {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });
  if (!profile) {
    throw new Error("Profile is not seeded yet. Run: pnpm prisma db seed");
  }
  return profile;
}

export async function getSocialLinks() {
  return prisma.socialLink.findMany({ orderBy: { platform: "asc" } });
}

export async function getSkills() {
  return prisma.skill.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getWorkExperience() {
  return prisma.workExperience.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getEducation() {
  return prisma.education.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getProjects() {
  return prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getHackathons() {
  return prisma.hackathon.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getPublishedPosts() {
  return prisma.blogPost.findMany({
    where: { draft: false },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({ where: { slug, draft: false } });
}
