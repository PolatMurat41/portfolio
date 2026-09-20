"use client";

import Link from "next/link";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialLinkItem {
  id: string;
  platform: string;
  url: string;
}

export function ContactSectionClient({ emailLink }: { emailLink?: SocialLinkItem }) {
  const { language } = useLanguage();
  const t = translations[language].contact;

  return (
    <div className="relative pt-4">
      <div className="border rounded-xl p-8 md:p-10 relative overflow-hidden bg-card/40 backdrop-blur-xs">
        <div className="absolute -top-3.5 border bg-primary z-20 rounded-xl px-4 py-1 left-1/2 -translate-x-1/2 shadow-xs">
          <span className="text-primary-foreground text-sm font-medium">{t.badge}</span>
        </div>
        <div className="absolute inset-0 top-0 left-0 right-0 h-1/2 rounded-xl overflow-hidden opacity-40">
          <FlickeringGrid
            className="h-full w-full"
            squareSize={2}
            gridGap={2}
            style={{
              maskImage: "linear-gradient(to bottom, black, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
            }}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">{t.title}</h2>
        {emailLink && (
          <Button asChild size="lg" className="rounded-xl mt-2 gap-2 shadow-sm font-medium">
            <Link href={emailLink.url}>
              <Mail className="size-4" />
              {t.buttonText}
            </Link>
          </Button>
        )}
      </div>
    </div>
  </div>
  );
}
