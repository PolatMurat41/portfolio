import { prisma } from "@/lib/prisma";
import { SortableList } from "@/components/admin/sortable-list";

export default async function HackathonsListPage() {
  const items = await prisma.hackathon.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Hackathons</h1>
      <SortableList
        basePath="/admin/hackathons"
        apiPath="/api/admin/hackathons"
        items={items.map((item) => ({
          id: item.id,
          label: item.title,
          content: (
            <div className="flex flex-col">
              <span className="font-medium">{item.title}</span>
              <span className="text-sm text-muted-foreground">
                {item.location} · {item.dates}
              </span>
            </div>
          ),
        }))}
      />
    </div>
  );
}
