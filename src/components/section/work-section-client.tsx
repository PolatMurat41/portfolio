"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LogoImage } from "@/components/section/logo-image";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

interface WorkItem {
  id: string;
  company: string;
  href: string;
  location: string;
  title: string;
  titleEn?: string | null;
  logoUrl: string;
  start: string;
  end: string;
  description: string;
  descriptionEn?: string | null;
  badges: string[];
}

export function WorkSectionClient({ work }: { work: WorkItem[] }) {
  const { language } = useLanguage();

  return (
    <Accordion type="single" collapsible className="w-full grid gap-6">
      {work.map((item) => {
        const displayTitle =
          language === "en" ? item.titleEn || item.title : item.title;
        const displayDesc =
          language === "en" ? item.descriptionEn || item.description : item.description;

        return (
          <AccordionItem key={item.id} value={item.id} className="w-full border-b-0 grid gap-2">
            <AccordionTrigger className="hover:no-underline p-0 cursor-pointer transition-colors rounded-none group [&>svg]:hidden">
              <div className="flex items-center gap-x-3 justify-between w-full text-left">
                <div className="flex items-center gap-x-3 flex-1 min-w-0">
                  <LogoImage src={item.logoUrl} alt={item.company} />
                  <div className="flex-1 min-w-0 gap-0.5 flex flex-col">
                    <div className="font-semibold leading-none flex items-center gap-2">
                      {item.company}
                      <span className="relative inline-flex items-center w-3.5 h-3.5">
                        <ChevronRight
                          className={cn(
                            "absolute h-3.5 w-3.5 shrink-0 text-muted-foreground stroke-2 transition-all duration-300 ease-out",
                            "translate-x-0 opacity-0",
                            "group-hover:translate-x-1 group-hover:opacity-100",
                            "group-data-[state=open]:opacity-0 group-data-[state=open]:translate-x-0"
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            "absolute h-3.5 w-3.5 shrink-0 text-muted-foreground stroke-2 transition-all duration-200",
                            "opacity-0 rotate-0",
                            "group-data-[state=open]:opacity-100 group-data-[state=open]:rotate-180"
                          )}
                        />
                      </span>
                    </div>
                    <div className="font-sans text-sm text-muted-foreground">{displayTitle}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground text-right flex-none">
                  <span>
                    {item.start} - {item.end ?? "Present"}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="p-0 ml-13 text-xs sm:text-sm text-muted-foreground">
              {displayDesc}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
