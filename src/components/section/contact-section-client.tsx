"use client";

import { AnimatedDotGrid } from "@/components/magicui/animated-dot-grid";
import { useLanguage } from "@/context/language-context";
import { getIcon } from "@/lib/icon-registry";
import { translations } from "@/lib/translations";

interface SocialLinkItem {
  id: string;
  platform: string;
  url: string;
}

const SOCIAL_ICON_KEY: Record<string, string> = {
  GitHub: "github",
  LinkedIn: "linkedin",
  X: "x",
  Youtube: "youtube",
};

export function ContactSectionClient({ socialLinks }: { socialLinks: SocialLinkItem[] }) {
  const { language } = useLanguage();
  const t = translations[language].contact;

  return (
    <div className="relative pt-4">
      {/* Sits on the card's top border; kept outside the clipped card so it isn't cut off. */}
      <div className="absolute left-1/2 top-0.5 z-20 -translate-x-1/2 rounded-xl border bg-primary px-4 py-1 shadow-xs">
        <span className="text-sm font-medium text-primary-foreground">{t.badge}</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border bg-card/80 shadow-sm">
        <AnimatedDotGrid
          className="absolute inset-0"
          maxOpacity={0.45}
          interactive
          style={{
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-6 p-6 pt-10 text-center md:p-10">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{t.title}</h2>

          {socialLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2.5">
              {socialLinks.map((social) => {
                const Icon = getIcon(SOCIAL_ICON_KEY[social.platform]);
                return (
                  <a
                    key={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.platform}
                    title={social.platform}
                    className="flex size-11 items-center justify-center rounded-xl border bg-background/70 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:text-foreground"
                  >
                    {Icon ? <Icon className="size-5" /> : social.platform.slice(0, 2)}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
