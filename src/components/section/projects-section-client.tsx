"use client";

import BlurFade from "@/components/magicui/blur-fade";
import { ProjectCard } from "@/components/project-card";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

const BLUR_FADE_DELAY = 0.04;

const PROJECT_SCREENSHOTS: Record<string, string> = {
  skorunkalbi: "/projects/skorunkalbi.png",
  "bi-lgi-cefis": "/projects/bi-lgi-cefis.png",
  "bilgi-running-community": "/projects/bilgi-running-community.png",
  "rafine-s-v-tuz": "/projects/rafine-s-v-tuz.png",
  "korfez-kuyumculuk": "/projects/korfez-kuyumculuk.png",
  "k-rfez-kuyumculuk": "/projects/korfez-kuyumculuk.png",
  "end-striyel-s-t-tedarik": "/projects/end-striyel-s-t-tedarik.png",
  adiatank: "/projects/adiatank.png",
};

interface Project {
  id: string;
  title: string;
  titleEn?: string | null;
  href: string;
  dates: string;
  active: boolean;
  description: string;
  descriptionEn?: string | null;
  technologies: string[];
  image: string;
  video: string;
  links: any;
  sortOrder: number;
}

export function ProjectsSectionClient({ projects }: { projects: Project[] }) {
  const { language } = useLanguage();
  const t = translations[language].projects;

  return (
    <section id="projects">
      <div className="flex min-h-0 flex-col gap-y-8">
        <div className="flex flex-col gap-y-4 items-center justify-center">
          <div className="flex items-center w-full">
            <div className="flex-1 h-px bg-linear-to-r from-transparent from-5% via-border via-95% to-transparent" />
            <div className="border bg-primary z-10 rounded-xl px-4 py-1">
              <span className="text-primary-foreground text-sm font-medium">{t.badge}</span>
            </div>
            <div className="flex-1 h-px bg-linear-to-l from-transparent from-5% via-border via-95% to-transparent" />
          </div>
          <div className="flex flex-col gap-y-3 items-center justify-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{t.title}</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-[800px] mx-auto auto-rows-fr">
          {projects.map((project, id) => {
            const slug = project.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");
            const localized = (t.items as any)[slug];

            // Priority: DB English field -> fallback dictionary -> primary DB field
            const displayTitle =
              language === "en"
                ? project.titleEn || localized?.title || project.title
                : project.title;
            const displayDesc =
              language === "en"
                ? project.descriptionEn || localized?.description || project.description
                : project.description;
            const displayImage = project.image || PROJECT_SCREENSHOTS[slug] || "";

            return (
              <BlurFade key={project.id} delay={BLUR_FADE_DELAY * 12 + id * 0.05} className="h-full">
                <ProjectCard
                  href={project.href}
                  title={displayTitle}
                  description={displayDesc}
                  dates={project.dates}
                  tags={project.technologies}
                  image={displayImage}
                  video={project.video}
                  links={project.links as { type: string; href: string; iconKey: string }[]}
                />
              </BlurFade>
            );
          })}
        </div>
      </div>
    </section>
  );
}
