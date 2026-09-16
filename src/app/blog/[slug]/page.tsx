import { getPublishedPosts, getProfile } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { remarkCodeMeta } from "@/lib/remark-code-meta";
import { mdxComponents } from "@/mdx-components";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

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

  return (
    <section id="blog">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdContent }}
      />
      <div className="flex justify-start gap-4 items-center">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2 py-1 inline-flex items-center gap-1 mb-6 group" aria-label="Back to Blog">
          <ChevronLeft className="size-3 group-hover:-translate-x-px transition-transform" />
          Back to Blog
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        <h1 className="title font-semibold text-3xl md:text-4xl tracking-tighter leading-tight">{post.title}</h1>
        <p className="text-sm text-muted-foreground">{post.publishedAt && formatDate(post.publishedAt)}</p>
      </div>
      <div className="my-6 flex w-full items-center">
        <div
          className="flex-1 h-px bg-border"
          style={{
            maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          }}
        />
      </div>
      <article className="prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
        <Markdown remarkPlugins={[remarkGfm, remarkCodeMeta]} rehypePlugins={[rehypeRaw]} components={mdxComponents}>
          {post.content}
        </Markdown>
      </article>

      <nav className="mt-12 pt-8 max-w-2xl">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {previousPost ? (
            <Link href={`/blog/${previousPost.slug}`} className="group flex-1 flex flex-col gap-1 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ChevronLeft className="size-3" />
                Previous
              </span>
              <span className="text-sm font-medium group-hover:text-foreground transition-colors whitespace-normal wrap-break-word">{previousPost.title}</span>
            </Link>
          ) : (
            <div className="hidden sm:block flex-1" />
          )}

          {nextPost ? (
            <Link href={`/blog/${nextPost.slug}`} className="group flex-1 flex flex-col gap-1 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors text-right">
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                Next
                <ChevronRight className="size-3" />
              </span>
              <span className="text-sm font-medium group-hover:text-foreground transition-colors whitespace-normal wrap-break-word">{nextPost.title}</span>
            </Link>
          ) : (
            <div className="hidden sm:block flex-1" />
          )}
        </div>
      </nav>
    </section>
  );
}
