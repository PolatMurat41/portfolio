"use client";

import { useLanguage } from "@/context/language-context";
import { formatDate } from "@/lib/utils";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { remarkCodeMeta } from "@/lib/remark-code-meta";
import { mdxComponents } from "@/mdx-components";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BlogPostData {
  slug: string;
  title: string;
  titleEn?: string | null;
  summary: string;
  summaryEn?: string | null;
  content: string;
  contentEn?: string | null;
  publishedAt: string | null;
}

interface NavPostData {
  slug: string;
  title: string;
  titleEn?: string | null;
}

export function BlogPostClient({
  post,
  previousPost,
  nextPost,
}: {
  post: BlogPostData;
  previousPost: NavPostData | null;
  nextPost: NavPostData | null;
}) {
  const { language } = useLanguage();

  const title = language === "en" ? post.titleEn || post.title : post.title;
  const content = language === "en" ? post.contentEn || post.content : post.content;
  const backText = language === "en" ? "Back to Articles" : "Makalelere Dön";
  const prevText = language === "en" ? "Previous" : "Önceki";
  const nextText = language === "en" ? "Next" : "Sonraki";

  return (
    <section id="blog">
      <div className="flex justify-start gap-4 items-center">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2.5 py-1 inline-flex items-center gap-1.5 mb-6 group shadow-2xs"
          aria-label={backText}
        >
          <ChevronLeft className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
          {backText}
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <h1 className="title font-semibold text-3xl md:text-4xl tracking-tighter leading-tight">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground font-mono">
          {post.publishedAt && formatDate(post.publishedAt)}
        </p>
      </div>

      <div className="my-6 flex w-full items-center">
        <div
          className="flex-1 h-px bg-border"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          }}
        />
      </div>

      <article className="prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
        <Markdown
          remarkPlugins={[remarkGfm, remarkCodeMeta]}
          rehypePlugins={[rehypeRaw]}
          components={mdxComponents}
        >
          {content}
        </Markdown>
      </article>

      <nav className="mt-12 pt-8 max-w-2xl border-t border-border">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {previousPost ? (
            <Link
              href={`/blog/${previousPost.slug}`}
              className="group flex-1 flex flex-col gap-1 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
            >
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ChevronLeft className="size-3" />
                {prevText}
              </span>
              <span className="text-sm font-medium group-hover:text-foreground transition-colors wrap-break-word">
                {language === "en"
                  ? previousPost.titleEn || previousPost.title
                  : previousPost.title}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block flex-1" />
          )}

          {nextPost ? (
            <Link
              href={`/blog/${nextPost.slug}`}
              className="group flex-1 flex flex-col gap-1 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors text-right"
            >
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                {nextText}
                <ChevronRight className="size-3" />
              </span>
              <span className="text-sm font-medium group-hover:text-foreground transition-colors wrap-break-word">
                {language === "en"
                  ? nextPost.titleEn || nextPost.title
                  : nextPost.title}
              </span>
            </Link>
          ) : (
            <div className="hidden sm:block flex-1" />
          )}
        </div>
      </nav>
    </section>
  );
}
