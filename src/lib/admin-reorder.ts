import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Reorderable = {
  update: (args: { where: { id: string }; data: { sortOrder: number } }) => Prisma.PrismaPromise<unknown>;
};

export async function applyReorder(delegate: Reorderable, ids: string[]) {
  await prisma.$transaction(ids.map((id, index) => delegate.update({ where: { id }, data: { sortOrder: index } })));
}
