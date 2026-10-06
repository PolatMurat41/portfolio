/* eslint-disable @next/next/no-img-element */
"use client";

import { useChat } from "@/components/chat/chat-provider";
import BlurFade from "@/components/magicui/blur-fade";
import BlurFadeText from "@/components/magicui/blur-fade-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { getIcon } from "@/lib/icon-registry";
import { translations } from "@/lib/translations";
import { ArrowUpRight, Mail, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";

const BLUR_FADE_DELAY = 0.04;

interface Profile {
  id: number;
  name: string;
  initials: string;
  url: string;
  location: string;
  locationLink: string;
  description: string;
  descriptionEn?: string | null;
  summary: string;
  summaryEn?: string | null;
  avatarUrl: string;
  email: string;
  tel: string;
}

interface Education {
  id: string;
  school: string;
  href: string;
  degree: string;
  logoUrl: string;
  start: string;
  end: string;
  sortOrder: number;
}

interface Skill {
  id: string;
  name: string;
  iconKey: string;
  sortOrder: number;
}

interface HomeContentProps {
  profile: Profile;
  education: Education[];
  skills: Skill[];
  workComponent: React.ReactNode;
  projectsComponent: React.ReactNode;
  articlesComponent: React.ReactNode;
  hackathonsComponent: React.ReactNode;
  contactComponent: React.ReactNode;
}

export function HomeContent({
  profile,
  education,
  skills,
  workComponent,
  projectsComponent,
  articlesComponent,
  hackathonsComponent,
  contactComponent,
}: HomeContentProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const chat = useChat();

  // Dynamic summary based on selected language, reading directly from database
  const activeSummary =
    language === "en"
      ? profile.summaryEn || t.about.summary
      : profile.summary || t.about.summary;
  const activeGreeting = `${t.hero.greeting} ${profile.name.split(" ")[0]}`;
  const activeDescription =
    language === "en"
      ? profile.descriptionEn || profile.description
      : profile.description;

  return (
    <main className="min-h-dvh flex flex-col gap-14 relative">
      <section id="hero">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="gap-2 gap-y-6 flex flex-col md:flex-row justify-between">
            <div className="gap-2 flex flex-col order-2 md:order-1">
              <BlurFade delay={BLUR_FADE_DELAY}>
                <span className="mb-1 inline-flex w-fit items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  {t.hero.available}
                </span>
              </BlurFade>
              <BlurFadeText
                delay={BLUR_FADE_DELAY}
                className="text-3xl font-semibold tracking-tighter sm:text-4xl lg:text-5xl"
                yOffset={8}
                text={activeGreeting}
              />
              <BlurFadeText
                className="text-muted-foreground max-w-[600px] md:text-lg lg:text-xl"
                delay={BLUR_FADE_DELAY}
                text={activeDescription}
              />
              {profile.location && (
                <BlurFade delay={BLUR_FADE_DELAY * 2}>
                  <a
                    href={profile.locationLink || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <MapPin className="size-3.5" />
                    {profile.location}
                  </a>
                </BlurFade>
              )}
              <BlurFade delay={BLUR_FADE_DELAY * 3}>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  <Button asChild className="gap-2 rounded-xl">
                    <a href="#contact">
                      <Mail className="size-4" />
                      {t.hero.ctaContact}
                    </a>
                  </Button>
                  {chat && (
                    <Button variant="outline" className="group gap-2 rounded-xl bg-background/70" onClick={() => chat.openChat()}>
                      <Sparkles className="size-4 transition-transform group-hover:rotate-12" />
                      {t.hero.ctaAskAi}
                    </Button>
                  )}
                </div>
              </BlurFade>
            </div>
            <BlurFade delay={BLUR_FADE_DELAY} className="order-1 md:order-2">
              <div className="relative size-fit rounded-full p-[3px]">
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,var(--foreground)_90deg,transparent_180deg,transparent_360deg)] opacity-60 animate-[spin_6s_linear_infinite] motion-reduce:animate-none"
                />
                <Avatar className="relative size-24 md:size-32 border-4 border-background rounded-full shadow-lg">
                  <AvatarImage alt={profile.name} src={profile.avatarUrl} />
                  <AvatarFallback>{profile.initials}</AvatarFallback>
                </Avatar>
              </div>
            </BlurFade>
          </div>
        </div>
      </section>

      <section id="about">
        <div className="flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 3}>
            <h2 className="text-xl font-bold">{t.about.title}</h2>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 4}>
            <div className="prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
              <Markdown>{activeSummary}</Markdown>
            </div>
          </BlurFade>
        </div>
      </section>

      <section id="work">
        <div className="flex min-h-0 flex-col gap-y-6">
          <BlurFade delay={BLUR_FADE_DELAY * 5}>
            <h2 className="text-xl font-bold">{t.work.title}</h2>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 6}>
            {workComponent}
          </BlurFade>
        </div>
      </section>

      <section id="education">
        <div className="flex min-h-0 flex-col gap-y-6">
          <BlurFade delay={BLUR_FADE_DELAY * 7}>
            <h2 className="text-xl font-bold">{t.education.title}</h2>
          </BlurFade>
          <div className="flex flex-col gap-8">
            {education.map((item, index) => (
              <BlurFade key={item.id} delay={BLUR_FADE_DELAY * 8 + index * 0.05}>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-x-3 justify-between group"
                >
                  <div className="flex items-center gap-x-3 flex-1 min-w-0">
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt={item.school}
                        className="size-8 md:size-10 p-1 border rounded-full shadow ring-2 ring-border overflow-hidden object-contain flex-none"
                      />
                    ) : (
                      <div className="size-8 md:size-10 p-1 border rounded-full shadow ring-2 ring-border bg-muted flex-none" />
                    )}
                    <div className="flex-1 min-w-0 gap-0.5 flex flex-col">
                      <div className="font-semibold leading-none flex items-center gap-2">
                        {item.school}
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" aria-hidden />
                      </div>
                      <div className="font-sans text-sm text-muted-foreground">{item.degree}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground text-right flex-none">
                    <span>
                      {item.start} - {item.end}
                    </span>
                  </div>
                </Link>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      <section id="skills">
        <div className="flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 9}>
            <h2 className="text-xl font-bold">{t.skills.title}</h2>
          </BlurFade>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, id) => {
              const Icon = getIcon(skill.iconKey);
              return (
                <BlurFade key={skill.id} delay={BLUR_FADE_DELAY * 10 + id * 0.05}>
                  <div className="border bg-background border-border ring-2 ring-border/20 rounded-xl h-8 w-fit px-4 flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-sm">
                    {Icon && <Icon className="size-4 rounded overflow-hidden object-contain" />}
                    <span className="text-foreground text-sm font-medium">{skill.name}</span>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        </div>
      </section>

      <section id="projects">
        <BlurFade delay={BLUR_FADE_DELAY * 11}>
          {projectsComponent}
        </BlurFade>
      </section>

      {/* DEDICATED ARTICLES SECTION */}
      <section id="articles-section">
        {articlesComponent}
      </section>

      <section id="hackathons">
        <BlurFade delay={BLUR_FADE_DELAY * 13}>
          {hackathonsComponent}
        </BlurFade>
      </section>

      <section id="contact">
        <BlurFade delay={BLUR_FADE_DELAY * 16}>
          {contactComponent}
        </BlurFade>
      </section>
    </main>
  );
}
