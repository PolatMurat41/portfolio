import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [posts, drafts, work, education, skills, projects, hackathons] = await Promise.all([
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { draft: true } }),
    prisma.workExperience.count(),
    prisma.education.count(),
    prisma.skill.count(),
    prisma.project.count(),
    prisma.hackathon.count(),
  ]);

  const stats = [
    { label: "Blog Posts", value: posts, hint: `${drafts} draft${drafts === 1 ? "" : "s"}`, href: "/admin/blog" },
    { label: "Work Experience", value: work, hint: null, href: "/admin/work" },
    { label: "Education", value: education, hint: null, href: "/admin/education" },
    { label: "Skills", value: skills, hint: null, href: "/admin/skills" },
    { label: "Projects", value: projects, hint: null, href: "/admin/projects" },
    { label: "Hackathons", value: hackathons, hint: null, href: "/admin/hackathons" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            {stat.hint && <p className="text-xs text-muted-foreground mt-1">{stat.hint}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
