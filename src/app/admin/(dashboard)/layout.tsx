import Link from "next/link";
import { LogoutButton } from "@/components/admin/logout-button";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/work", label: "Work Experience" },
  { href: "/admin/education", label: "Education" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/hackathons", label: "Hackathons" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-sm">Admin</span>
          <LogoutButton />
        </div>
        <nav className="flex flex-row md:flex-col gap-1 flex-wrap">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 max-w-4xl">{children}</main>
    </div>
  );
}
