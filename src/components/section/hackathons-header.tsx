"use client";

import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";

export function HackathonsHeader() {
  const { language } = useLanguage();
  const t = translations[language].hackathons;

  return (
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
  );
}
