import { prisma } from "@/lib/prisma";
import { SortableList } from "@/components/admin/sortable-list";

export default async function ProjectsListPage() {
  const items = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Projects</h1>
      <SortableList
        basePath="/admin/projects"
        apiPath="/api/admin/projects"
        items={items.map((item) => ({
          id: item.id,
          label: item.title,
          content: (
            <div className="flex flex-col">
              <span className="font-medium">{item.title}</span>
              <span className="text-sm text-muted-foreground">{item.dates}</span>
            </div>
          ),
        }))}
      />
    </div>
  );
}
