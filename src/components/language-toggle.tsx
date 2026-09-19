"use client";

import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      type="button"
      size="icon"
      className={cn("px-2 rounded-full font-bold text-xs flex items-center justify-center select-none", className)}
      onClick={toggleLanguage}
      title={language === "tr" ? "Switch to English" : "Türkçe'ye geç"}
      aria-label="Toggle language"
    >
      <span className={cn("transition-all font-semibold tracking-wider", language === "tr" ? "text-primary" : "text-primary")}>
        {language === "tr" ? "TR" : "EN"}
      </span>
    </Button>
  );
}
