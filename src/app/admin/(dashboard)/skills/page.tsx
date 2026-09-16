import { prisma } from "@/lib/prisma";
import { SortableList } from "@/components/admin/sortable-list";
import { getIcon } from "@/lib/icon-registry";

export default async function SkillsListPage() {
  const items = await prisma.skill.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Skills</h1>
      <SortableList
        items={items}
        basePath="/admin/skills"
        apiPath="/api/admin/skills"
        renderLabel={(item) => item.name}
        renderItem={(item) => {
          const Icon = getIcon(item.iconKey);
          return (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="size-4" />}
              <span className="font-medium">{item.name}</span>
            </div>
          );
        }}
      />
    </div>
  );
}
