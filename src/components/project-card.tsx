/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@/components/ui/badge";
import { getIcon } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Markdown from "react-markdown";

function ProjectImage({ src, alt }: { src: string; alt: string }) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return <div className="w-full h-48 bg-muted" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="w-full h-48 object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
      onError={() => setImageError(true)}
    />
  );
}

interface Props {
  title: string;
  href?: string;
  description: string;
  dates: string;
  tags: readonly string[];
  image?: string;
  video?: string;
  links?: readonly { type: string; href: string; iconKey: string }[];
  className?: string;
}

export function ProjectCard({
  title,
  href,
  description,
  dates,
  tags,
  image,
  video,
  links,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "group flex flex-col h-full border border-border rounded-xl overflow-hidden bg-card/90 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-xl hover:shadow-foreground/5",
        className
      )}
    >
      <div className="relative shrink-0 overflow-hidden border-b border-border">
        <Link href={href || "#"} target="_blank" rel="noopener noreferrer" className="block">
          {video ? (
            <video src={video} autoPlay loop muted playsInline className="w-full h-48 object-cover" />
          ) : image ? (
            <ProjectImage src={image} alt={title} />
          ) : (
            <div className="w-full h-48 bg-muted" />
          )}
        </Link>
        {links && links.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-wrap gap-2">
            {links.map((link, idx) => {
              const Icon = getIcon(link.iconKey);
              return (
                <Link href={link.href} key={idx} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <Badge className="flex items-center gap-1.5 text-xs bg-black text-white hover:bg-black/90" variant="default">
                    {Icon && <Icon className="size-3" />}
                    {link.type}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">{title}</h3>
            <time className="text-xs text-muted-foreground">{dates}</time>
          </div>
          <Link
            href={href || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label={`Open ${title}`}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="text-xs flex-1 prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
          <Markdown>{description}</Markdown>
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {tags.map((tag) => (
              <Badge key={tag} className="text-[11px] font-medium border border-border h-6 w-fit px-2" variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
