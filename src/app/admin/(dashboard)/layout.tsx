import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AnimatedDotGrid } from "@/components/magicui/animated-dot-grid";
import { prisma } from "@/lib/prisma";
import { ensureSchema } from "@/lib/schema-sync";

const BACKGROUND_MASK = "linear-gradient(to bottom, black, transparent 35%)";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await ensureSchema();
  const unreadMessages = await prisma.contactMessage.count({ where: { read: false } }).catch(() => 0);

  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row bg-background">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <AnimatedDotGrid
          className="h-full w-full"
          maxOpacity={0.18}
          style={{ maskImage: BACKGROUND_MASK, WebkitMaskImage: BACKGROUND_MASK }}
        />
      </div>
      <AdminSidebar unreadMessages={unreadMessages} />
      <main className="relative z-10 flex-1 min-w-0 p-6 md:p-10 w-full overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
