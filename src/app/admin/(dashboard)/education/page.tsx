import { prisma } from "@/lib/prisma";
import { SortableList } from "@/components/admin/sortable-list";

export default async function EducationListPage() {
  const items = await prisma.education.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Education</h1>
      <SortableList
        basePath="/admin/education"
        apiPath="/api/admin/education"
        items={items.map((item) => ({
          id: item.id,
          label: item.school,
          content: (
            <div className="flex flex-col">
              <span className="font-medium">{item.school}</span>
              <span className="text-sm text-muted-foreground">
                {item.degree} · {item.start} - {item.end}
              </span>
            </div>
          ),
        }))}
      />
    </div>
  );
}
