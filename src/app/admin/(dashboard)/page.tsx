import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  Sparkles,
  FolderGit2,
  Trophy,
  PlusCircle,
  User,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const [profile, posts, drafts, work, education, skills, projects, hackathons] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { draft: true } }),
    prisma.workExperience.count(),
    prisma.education.count(),
    prisma.skill.count(),
    prisma.project.count(),
    prisma.hackathon.count(),
  ]);

  const stats = [
    {
      label: "Makaleler & Blog",
      value: posts,
      hint: drafts > 0 ? `${drafts} taslak` : "Tümü yayında",
      href: "/admin/blog",
      icon: BookOpen,
      color: "from-blue-500/10 to-indigo-500/10 text-blue-500",
    },
    {
      label: "Canlı Projeler",
      value: projects,
      hint: "Ekran görüntüleri bağlı",
      href: "/admin/projects",
      icon: FolderGit2,
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-500",
    },
    {
      label: "Yetenekler & Teknolojiler",
      value: skills,
      hint: "AI & Full Stack",
      href: "/admin/skills",
      icon: Sparkles,
      color: "from-amber-500/10 to-orange-500/10 text-amber-500",
    },
    {
      label: "İş Deneyimi",
      value: work,
      hint: "Kariyer geçmişi",
      href: "/admin/work",
      icon: Briefcase,
      color: "from-purple-500/10 to-pink-500/10 text-purple-500",
    },
    {
      label: "Eğitim Bilgileri",
      value: education,
      hint: "Akademik geçmiş",
      href: "/admin/education",
      icon: GraduationCap,
      color: "from-rose-500/10 to-red-500/10 text-rose-500",
    },
    {
      label: "Hackathonlar",
      value: hackathons,
      hint: "Yarışmalar",
      href: "/admin/hackathons",
      icon: Trophy,
      color: "from-cyan-500/10 to-sky-500/10 text-cyan-500",
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Yönetim Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Hoş geldiniz, {profile?.name || "Murat Can Polat"}. Portföyünüzün tüm bileşenlerini buradan yönetebilirsiniz.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="rounded-xl gap-2 font-medium">
            <Link href="/admin/blog/new">
              <PlusCircle className="size-4" />
              Yeni Makale
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl gap-2 font-medium">
            <Link href="/admin/projects/new">
              <PlusCircle className="size-4" />
              Yeni Proje
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative border border-border rounded-2xl p-6 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all shadow-xs hover:shadow-md flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between">
                <div className={`size-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="size-5" />
                </div>
                <ArrowRight className="size-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </div>
              <div>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{stat.label}</p>
                {stat.hint && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.hint}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Access & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        <div className="border border-border rounded-2xl p-6 bg-card flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="size-5 text-primary" />
            Profil Özeti
          </h2>
          <div className="text-sm space-y-2 text-muted-foreground">
            <p><strong className="text-foreground">İsim:</strong> {profile?.name}</p>
            <p><strong className="text-foreground">Unvan:</strong> {profile?.description}</p>
            <p><strong className="text-foreground">Konum:</strong> {profile?.location}</p>
            <p><strong className="text-foreground">E-posta:</strong> {profile?.email}</p>
          </div>
          <div className="pt-2">
            <Button asChild variant="secondary" size="sm" className="rounded-xl">
              <Link href="/admin/profile">Profili Düzenle</Link>
            </Button>
          </div>
        </div>

        <div className="border border-border rounded-2xl p-6 bg-card flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Öne Çıkan Makale
          </h2>
          <div className="text-sm space-y-1.5 text-muted-foreground">
            <p className="font-semibold text-foreground">Nowcasting Inflation Using Online Prices</p>
            <p className="text-xs text-muted-foreground">
              CEFIS Working Paper & iCEBDA 2025 • M. Ege Yazgan, Umutcan Adıgüzel, Murat Can Polat, Barış Soybilgen
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">✓ Sitede ve Blogda Yayında</p>
          </div>
          <div className="pt-2 flex gap-3">
            <Button asChild variant="secondary" size="sm" className="rounded-xl">
              <Link href="/admin/blog">Makaleleri Yönet</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl">
              <Link href="/blog/nowcasting-inflation-using-online-prices" target="_blank">
                Canlı Önizle
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
