import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { DATA } from "../src/data/resume";
import type { IconKey } from "../src/lib/icon-registry";

const SKILL_ICON_KEYS: Record<string, IconKey> = {
  React: "react",
  "Next.js": "nextjs",
  Typescript: "typescript",
  "Node.js": "nodejs",
  Python: "python",
  Go: "golang",
  Postgres: "postgresql",
  Docker: "docker",
  Kubernetes: "kubernetes",
  Java: "java",
  "C++": "csharp",
};

const PROJECT_LINK_ICON: Record<string, IconKey> = {
  Website: "globe",
  Source: "github",
};

function hackathonLinkIcon(title: string): IconKey {
  if (title === "YouTube") return "youtube";
  if (["Devpost", "Medium Article", "Article", "Site"].includes(title)) return "globe";
  return "github";
}

const SOCIAL_PLATFORM_MAP: Record<string, "GitHub" | "LinkedIn" | "X" | "Youtube" | "Email"> = {
  GitHub: "GitHub",
  LinkedIn: "LinkedIn",
  X: "X",
  Youtube: "Youtube",
  email: "Email",
};

function parseFrontmatter(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter block");
  const [, block, content] = match;
  const data: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const lineMatch = line.match(/^([a-zA-Z]+):\s*"?([^"]*)"?\s*$/);
    if (lineMatch) data[lineMatch[1]] = lineMatch[2];
  }
  return { data, content: content.trim() };
}

function stripMediaContainer(markdown: string): string {
  return markdown.replace(
    /<MediaContainer\s+src="([^"]+)"\s+alt="([^"]+)"\s*\/>/,
    (_match, src, alt) => `![${alt}](${src})`
  );
}

async function seedProfileAndSocial() {
  await prisma.profile.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name: DATA.name,
      initials: DATA.initials,
      url: DATA.url,
      location: DATA.location,
      locationLink: DATA.locationLink,
      description: DATA.description,
      summary: DATA.summary,
      avatarUrl: DATA.avatarUrl,
      email: DATA.contact.email,
      tel: DATA.contact.tel,
    },
    update: {},
  });

  for (const [key, social] of Object.entries(DATA.contact.social)) {
    const platform = SOCIAL_PLATFORM_MAP[key];
    if (!platform) continue;
    await prisma.socialLink.upsert({
      where: { platform },
      create: { platform, url: social.url, showInNavbar: social.navbar },
      update: { url: social.url, showInNavbar: social.navbar },
    });
  }
}

async function seedSkills() {
  for (const [index, skill] of DATA.skills.entries()) {
    const iconKey = SKILL_ICON_KEYS[skill.name];
    if (!iconKey) throw new Error(`No iconKey mapping for skill "${skill.name}"`);
    await prisma.skill.create({ data: { name: skill.name, iconKey, sortOrder: index } });
  }
}

async function seedWork() {
  for (const [index, work] of DATA.work.entries()) {
    await prisma.workExperience.create({
      data: {
        company: work.company,
        href: work.href,
        location: work.location,
        title: work.title,
        logoUrl: work.logoUrl,
        start: work.start,
        end: work.end,
        description: work.description,
        badges: [...work.badges],
        sortOrder: index,
      },
    });
  }
}

async function seedEducation() {
  for (const [index, education] of DATA.education.entries()) {
    await prisma.education.create({
      data: {
        school: education.school,
        href: education.href,
        degree: education.degree,
        logoUrl: education.logoUrl,
        start: education.start,
        end: education.end,
        sortOrder: index,
      },
    });
  }
}

async function seedProjects() {
  for (const [index, project] of DATA.projects.entries()) {
    await prisma.project.create({
      data: {
        title: project.title,
        href: project.href,
        dates: project.dates,
        active: project.active,
        description: project.description,
        technologies: [...project.technologies],
        image: project.image,
        video: project.video,
        links: project.links.map((link) => ({
          type: link.type,
          href: link.href,
          iconKey: PROJECT_LINK_ICON[link.type] ?? "globe",
        })),
        sortOrder: index,
      },
    });
  }
}

async function seedHackathons() {
  for (const [index, hackathon] of DATA.hackathons.entries()) {
    await prisma.hackathon.create({
      data: {
        title: hackathon.title,
        dates: hackathon.dates,
        location: hackathon.location,
        description: hackathon.description,
        image: hackathon.image,
        mlh: "mlh" in hackathon ? (hackathon.mlh as string) : null,
        win: "win" in hackathon ? (hackathon.win as string) : null,
        links: hackathon.links.map((link) => ({
          title: link.title,
          href: link.href,
          iconKey: hackathonLinkIcon(link.title),
        })),
        sortOrder: index,
      },
    });
  }
}

async function seedBlogPosts() {
  const contentDir = path.join(__dirname, "..", "content");
  const files = readdirSync(contentDir).filter((file) => file.endsWith(".mdx"));

  for (const file of files) {
    const raw = readFileSync(path.join(contentDir, file), "utf-8");
    const { data, content } = parseFrontmatter(raw);
    const slug = file.replace(/\.mdx$/, "");

    await prisma.blogPost.upsert({
      where: { slug },
      create: {
        slug,
        title: data.title,
        summary: data.summary,
        content: stripMediaContainer(content),
        image: data.image || null,
        draft: false,
        publishedAt: new Date(data.publishedAt),
      },
      update: {},
    });
  }
}

async function main() {
  await seedProfileAndSocial();
  await seedSkills();
  await seedWork();
  await seedEducation();
  await seedProjects();
  await seedHackathons();
  await seedBlogPosts();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
