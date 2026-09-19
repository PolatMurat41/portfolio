"use client";

import BlurFade from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { ArrowUpRight, BookOpen, ExternalLink, GraduationCap, Users } from "lucide-react";
import Link from "next/link";

const BLUR_FADE_DELAY = 0.04;

export default function ArticlesSection() {
  const { language } = useLanguage();
  const t = translations[language].articles;

  return (
    <section id="articles" className="w-full">
      <div className="flex min-h-0 flex-col gap-y-8">
        <div className="flex flex-col gap-y-4 items-center justify-center">
          <div className="flex items-center w-full">
            <div className="flex-1 h-px bg-linear-to-r from-transparent from-5% via-border via-95% to-transparent" />
            <div className="border bg-primary z-10 rounded-xl px-4 py-1 flex items-center gap-1.5">
              <GraduationCap className="size-4 text-primary-foreground" />
              <span className="text-primary-foreground text-sm font-medium">{t.badge}</span>
            </div>
            <div className="flex-1 h-px bg-linear-to-l from-transparent from-5% via-border via-95% to-transparent" />
          </div>
          <div className="flex flex-col gap-y-3 items-center justify-center text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{t.title}</h2>
            <p className="text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed text-balance max-w-xl">
              {t.subtitle}
            </p>
          </div>
        </div>

        <BlurFade delay={BLUR_FADE_DELAY * 13}>
          <div className="group relative rounded-2xl border border-border bg-card p-6 md:p-8 shadow-md transition-all hover:shadow-xl hover:border-primary/40 flex flex-col gap-5">
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/20">
                <BookOpen className="size-3.5" />
                {t.paperBadge}
              </span>
              <span className="text-xs font-mono text-muted-foreground">March 2026</span>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                {t.paperTitle}
              </h3>
              <div className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                <Users className="size-4 mt-0.5 shrink-0 text-primary" />
                <span>
                  <strong className="text-foreground">{t.authorsLabel}:</strong> {t.authors}
                </span>
              </div>
            </div>

            {/* Description / Abstract */}
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
              {t.paperDesc}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                "Inflation Nowcasting",
                "Online Prices",
                "Big Data",
                "Machine Learning",
                "Econometrics",
                "CEFIS",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-0.5 text-xs rounded-md bg-muted text-muted-foreground font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/60">
              <Button asChild size="sm" className="gap-2 rounded-lg font-medium shadow-sm">
                <Link href="/blog/nowcasting-inflation-using-online-prices">
                  <BookOpen className="size-4" />
                  {t.readPaper}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="gap-2 rounded-lg font-medium">
                <a
                  href="https://cefis.bilgi.edu.tr/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="size-4" />
                  {t.viewCefis}
                  <ArrowUpRight className="size-3.5 text-muted-foreground" />
                </a>
              </Button>
            </div>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
