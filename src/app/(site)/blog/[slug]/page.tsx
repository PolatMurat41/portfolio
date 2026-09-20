import { getPublishedPosts, getProfile } from "@/lib/data";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostClient } from "@/components/blog-post-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata | undefined> {
  const { slug } = await params;
  const [posts, profile] = await Promise.all([getPublishedPosts(), getProfile()]);
  const post = posts.find((p) => p.slug === slug);
  if (!post) return undefined;

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      url: `${profile.url}/blog/${slug}`,
      ...(post.image && { images: [{ url: `${profile.url}${post.image}` }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      ...(post.image && { images: [`${profile.url}${post.image}`] }),
    },
  };
}

export default async function Blog({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [sortedPosts, profile] = await Promise.all([getPublishedPosts(), getProfile()]);
  const currentIndex = sortedPosts.findIndex((p) => p.slug === slug);
  const post = sortedPosts[currentIndex];

  if (!post) {
    notFound();
  }

  const previousPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

  const jsonLdContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    description: post.summary,
    image: post.image ? `${profile.url}${post.image}` : `${profile.url}/blog/${slug}/opengraph-image`,
    url: `${profile.url}/blog/${slug}`,
    author: { "@type": "Person", name: profile.name },
  }).replace(/</g, "\\u003c");

  const serializedPost = {
    slug: post.slug,
    title: post.title,
    titleEn: (post as any).titleEn ?? null,
    summary: post.summary,
    summaryEn: (post as any).summaryEn ?? null,
    content: post.content,
    contentEn: (post as any).contentEn ?? null,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
  };

  const serializedPrev = previousPost
    ? {
        slug: previousPost.slug,
        title: previousPost.title,
        titleEn: (previousPost as any).titleEn ?? null,
      }
    : null;

  const serializedNext = nextPost
    ? {
        slug: nextPost.slug,
        title: nextPost.title,
        titleEn: (nextPost as any).titleEn ?? null,
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdContent }}
      />
      <BlogPostClient
        post={serializedPost}
        previousPost={serializedPrev}
        nextPost={serializedNext}
      />
    </>
  );
}
