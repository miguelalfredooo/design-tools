"use client";

import { FadeIn } from "@/components/motion/fade-in";
import { CreatorToolsPageSurface } from "@/components/design/creator-tools-page-surface";
import { CreatorToolsOverviewHeader } from "@/components/design/creator-tools-overview-header";
import { CreatorToolsOverviewMap } from "@/components/design/creator-tools-overview-map";
import { CreatorToolsOverviewSignal } from "@/components/design/creator-tools-overview-signal";

export default function CreatorToolsDropPage() {
  return (
    <div className="w-full min-w-0 space-y-6">
      <CreatorToolsOverviewHeader />

      <FadeIn delay={0.03} className="w-full">
        <CreatorToolsOverviewMap />
      </FadeIn>

      <FadeIn delay={0.05} className="w-full">
        <CreatorToolsPageSurface tone="gradient">
          <CreatorToolsOverviewSignal />
        </CreatorToolsPageSurface>
      </FadeIn>
    </div>
  );
}
