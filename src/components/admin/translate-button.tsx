"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";

interface TranslateButtonProps {
  textToTranslate: string;
  onTranslated: (translatedText: string) => void;
  label?: string;
  className?: string;
}

export function TranslateButton({
  textToTranslate,
  onTranslated,
  label = "İngilizceye Çevir",
  className,
}: TranslateButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleTranslate() {
    if (!textToTranslate?.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToTranslate, from: "tr", to: "en" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translatedText) {
          onTranslated(data.translatedText);
        }
      }
    } catch (err) {
      console.error("Auto-translate failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`h-7 px-2.5 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10 ${
        className || ""
      }`}
      disabled={loading || !textToTranslate?.trim()}
      onClick={handleTranslate}
      title="Türkçe metni otomatik olarak İngilizceye çevirir"
    >
      {loading ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <Sparkles className="size-3" />
      )}
      <span>{loading ? "Çevriliyor..." : label}</span>
    </Button>
  );
}
