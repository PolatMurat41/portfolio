import { getPublishedPosts } from "@/lib/data";
import type { Metadata } from "next";
import { paginate, normalizePage } from "@/lib/pagination";
import { BlogListClient } from "@/components/blog-list-client";

export const metadata: Metadata = {
  title: "Blog & Makaleler",
  description: "Thoughts on software development, AI, econometrics, and more.",
  openGraph: {
    title: "Blog & Makaleler",
    description: "Thoughts on software development, AI, econometrics, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog & Makaleler",
    description: "Thoughts on software development, AI, econometrics, and more.",
  },
};

const PAGE_SIZE = 5;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const sortedPosts = await getPublishedPosts();

  const totalPages = Math.ceil(sortedPosts.length / PAGE_SIZE);
  const currentPage = normalizePage(pageParam, totalPages);
  const { items: paginatedPosts, pagination } = paginate(sortedPosts, {
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  const serializedPosts = paginatedPosts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    titleEn: (p as any).titleEn ?? null,
    summary: p.summary,
    summaryEn: (p as any).summaryEn ?? null,
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
  }));

  return (
    <BlogListClient
      totalCount={sortedPosts.length}
      paginatedPosts={serializedPosts}
      pagination={pagination}
    />
  );
}
