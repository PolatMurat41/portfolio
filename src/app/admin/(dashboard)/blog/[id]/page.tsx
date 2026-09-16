import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogForm } from "@/components/admin/blog-form";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Blog Post</h1>
      <BlogForm
        initialValues={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          content: post.content,
          image: post.image ?? "",
          draft: post.draft,
        }}
      />
    </div>
  );
}
