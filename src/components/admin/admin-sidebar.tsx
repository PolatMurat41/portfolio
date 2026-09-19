"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/admin/logout-button";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  User,
  Briefcase,
  GraduationCap,
  Sparkles,
  FolderGit2,
  Trophy,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/blog", label: "Makaleler & Blog", icon: BookOpen },
  { href: "/admin/profile", label: "Profil & Hakkımda", icon: User },
  { href: "/admin/work", label: "İş Deneyimi", icon: Briefcase },
  { href: "/admin/education", label: "Eğitim", icon: GraduationCap },
  { href: "/admin/skills", label: "Yetenekler", icon: Sparkles },
  { href: "/admin/projects", label: "Projeler", icon: FolderGit2 },
  { href: "/admin/hackathons", label: "Hackathonlar", icon: Trophy },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-border bg-card/60 backdrop-blur-md flex flex-col justify-between p-4 md:p-6 min-h-full">
      <div className="flex flex-col gap-6">
        {/* Brand header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight block">Portfolio Admin</span>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                CMS Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-row md:flex-col gap-1.5 flex-wrap">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 text-sm px-3.5 py-2.5 rounded-xl font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
                )}
              >
                <Icon className={cn("size-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Controls */}
      <div className="flex flex-col gap-3 pt-6 mt-6 border-t border-border">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="size-3.5" />
            Siteyi Canlı Gör
          </span>
          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">/</span>
        </Link>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <ModeToggle className="size-8" />
            <span className="text-xs text-muted-foreground">Tema</span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
