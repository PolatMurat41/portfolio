import { prisma } from "@/lib/prisma";
import { SortableList } from "@/components/admin/sortable-list";

export default async function WorkListPage() {
  const items = await prisma.workExperience.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Work Experience</h1>
      <SortableList
        items={items}
        basePath="/admin/work"
        apiPath="/api/admin/work"
        renderLabel={(item) => item.company}
        renderItem={(item) => (
          <div className="flex flex-col">
            <span className="font-medium">{item.company}</span>
            <span className="text-sm text-muted-foreground">
              {item.title} · {item.start} - {item.end}
            </span>
          </div>
        )}
      />
    </div>
  );
}
