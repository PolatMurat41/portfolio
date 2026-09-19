import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 md:p-10 w-full overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
