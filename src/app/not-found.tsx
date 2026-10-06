import Link from "next/link";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AnimatedDotGrid } from "@/components/magicui/animated-dot-grid";

const BACKGROUND_MASK = "radial-gradient(ellipse at center, transparent 15%, black 70%)";

export default function NotFound() {
    return (
        <div className="relative min-h-dvh flex flex-col">
            <div aria-hidden className="pointer-events-none fixed inset-0">
                <AnimatedDotGrid
                    className="h-full w-full"
                    maxOpacity={0.35}
                    interactive
                    style={{ maskImage: BACKGROUND_MASK, WebkitMaskImage: BACKGROUND_MASK }}
                />
            </div>
            <div className="relative flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center text-center max-w-md relative">
                    <h1 className="text-[200px] font-semibold font-mono bg-linear-to-b from-primary/30 to-secondary/10 text-transparent bg-clip-text absolute -top-40 left-1/2 -translate-x-1/2 mask-[linear-gradient(to_bottom,black,black_20%,transparent_80%)] tracking-tighter uppercase [-webkit-text-stroke:3px_hsl(var(--primary)/0.6)]">
                        404
                    </h1>
                    <h2 className="text-4xl tracking-tight font-semibold text-foreground mb-2">
                        Page Not Found
                    </h2>
                    <p className="text-muted-foreground mb-8 text-balance tracking-tight font-medium">
                        The page you&apos;re looking for doesn&apos;t exist or may have been
                        moved.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/">
                            <Button variant="outline" className="gap-2 cursor-pointer">
                                <Home className="h-4 w-4" />
                                Go to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}


