/* eslint-disable @next/next/no-img-element */
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getHackathons } from "@/lib/data";
import { getIcon } from "@/lib/icon-registry";
import { Timeline, TimelineItem, TimelineConnectItem } from "@/components/timeline";
import { HackathonsHeader } from "./hackathons-header";

export default async function HackathonsSection() {
  const hackathons = await getHackathons();

  if (hackathons.length === 0) {
    return null;
  }

  return (
    <section id="hackathons" className="overflow-hidden">
      <div className="flex min-h-0 flex-col gap-y-8 w-full">
        <HackathonsHeader />
        <Timeline>
          {hackathons.map((hackathon) => (
            <TimelineItem key={hackathon.id} className="w-full flex items-start justify-between gap-10">
              <TimelineConnectItem className="flex items-start justify-center">
                {hackathon.image ? (
                  <img
                    src={hackathon.image}
                    alt={hackathon.title}
                    className="size-10 bg-card z-10 shrink-0 overflow-hidden p-1 border rounded-full shadow ring-2 ring-border object-contain flex-none"
                  />
                ) : (
                  <div className="size-10 bg-card z-10 shrink-0 overflow-hidden p-1 border rounded-full shadow ring-2 ring-border flex-none" />
                )}
              </TimelineConnectItem>
              <div className="flex flex-1 flex-col justify-start gap-2 min-w-0">
                {hackathon.dates && <time className="text-xs text-muted-foreground">{hackathon.dates}</time>}
                {hackathon.title && <h3 className="font-semibold leading-none">{hackathon.title}</h3>}
                {hackathon.location && <p className="text-sm text-muted-foreground">{hackathon.location}</p>}
                {hackathon.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed wrap-break-word">{hackathon.description}</p>
                )}
                {(() => {
                  const links = hackathon.links as { title: string; href: string; iconKey: string }[];
                  return (
                    links.length > 0 && (
                      <div className="mt-1 flex flex-row flex-wrap items-start gap-2">
                        {links.map((link, idx) => {
                          const Icon = getIcon(link.iconKey);
                          return (
                            <Link href={link.href} key={idx} target="_blank" rel="noopener noreferrer">
                              <Badge className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground">
                                {Icon && <Icon className="h-4 w-4" />}
                                {link.title}
                              </Badge>
                            </Link>
                          );
                        })}
                      </div>
                    )
                  );
                })()}
              </div>
            </TimelineItem>
          ))}
        </Timeline>
      </div>
    </section>
  );
}
