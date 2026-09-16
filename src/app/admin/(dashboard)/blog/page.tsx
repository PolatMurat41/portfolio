import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { BlogList } from "@/components/admin/blog-list";

export default async function BlogListPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Blog</h1>
        <Button asChild size="sm">
          <Link href="/admin/blog/new">
            <Plus className="size-4" /> Add New
          </Link>
        </Button>
      </div>
      <BlogList posts={posts.map(({ id, slug, title, draft }) => ({ id, slug, title, draft }))} />
    </div>
  );
}
