"use client";

import { AnimatedDotGrid } from "@/components/magicui/animated-dot-grid";
import { useLanguage } from "@/context/language-context";
import { getIcon } from "@/lib/icon-registry";
import { translations } from "@/lib/translations";
import { Check, Copy, Mail } from "lucide-react";
import { useState } from "react";

interface SocialLinkItem {
  id: string;
  platform: string;
  url: string;
}

interface ContactSectionClientProps {
  email: string;
  socialLinks: SocialLinkItem[];
}

const SOCIAL_ICON_KEY: Record<string, string> = {
  GitHub: "github",
  LinkedIn: "linkedin",
  X: "x",
  Youtube: "youtube",
};

export function ContactSectionClient({ email, socialLinks }: ContactSectionClientProps) {
  const { language } = useLanguage();
  const t = translations[language].contact;
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  }

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

          <div className="flex w-full max-w-md items-center gap-3 rounded-xl border bg-background/70 p-3 pl-4 text-left">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Mail className="size-4" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-xs text-muted-foreground">{t.emailLabel}</span>
              <a href={`mailto:${email}`} className="truncate text-sm font-medium hover:underline underline-offset-4">
                {email}
              </a>
            </div>
            <button
              type="button"
              onClick={copyEmail}
              aria-label={copied ? t.copied : t.copy}
              title={copied ? t.copied : t.copy}
              className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            </button>
          </div>

          {socialLinks.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
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
                    className="flex size-10 items-center justify-center rounded-xl border bg-background/70 text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:text-foreground"
                  >
                    {Icon ? <Icon className="size-4" /> : social.platform.slice(0, 2)}
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
