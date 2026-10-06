import Navbar from "@/components/navbar";
import { AnimatedDotGrid } from "@/components/magicui/animated-dot-grid";
import { ChatProvider } from "@/components/chat/chat-provider";
import { ScrollProgress } from "@/components/scroll-progress";
import { SiteFooter } from "@/components/site-footer";
import { getChatbotPublicConfig } from "@/lib/chatbot/settings";
import { getProfile } from "@/lib/data";

// Dots stay fully visible along the top and side edges and are toned down
// behind the centred content column so text keeps its contrast.
const BACKGROUND_MASK =
  "linear-gradient(to bottom, black, transparent 40%), linear-gradient(to right, black, rgba(0,0,0,0.45) 28%, rgba(0,0,0,0.45) 72%, black)";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [chatbot, profile] = await Promise.all([
    getChatbotPublicConfig(),
    getProfile().catch(() => null),
  ]);

  return (
    <ChatProvider config={chatbot}>
      <ScrollProgress />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <AnimatedDotGrid
          className="h-full w-full"
          squareSize={2}
          gridGap={2}
          maxOpacity={0.3}
          interactive
          wave
          style={{ maskImage: BACKGROUND_MASK, WebkitMaskImage: BACKGROUND_MASK }}
        />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto py-12 pb-24 sm:py-24 px-6">
        {children}
        <SiteFooter name={profile?.name} />
      </div>
      <Navbar />
    </ChatProvider>
  );
}
