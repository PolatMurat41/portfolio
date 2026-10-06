"use client";

import { useLanguage } from "@/context/language-context";
import { translations } from "@/lib/translations";
import { ArrowUp } from "lucide-react";

export function SiteFooter({ name }: { name?: string }) {
  const { language } = useLanguage();
  const t = translations[language].footer;

  return (
    <footer className="mt-20 flex flex-col items-center justify-between gap-3 border-t pt-6 text-xs text-muted-foreground sm:flex-row">
      <p>
        © {new Date().getFullYear()} {name} · {t.rights}
      </p>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="group inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
      >
        {t.backToTop}
        <ArrowUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
      </a>
    </footer>
  );
}
