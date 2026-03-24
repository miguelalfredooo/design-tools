"use client";

import { Sparkles } from "lucide-react";
import { CreatorToolsPageHeader } from "@/components/design/creator-tools-page-header";

export function CreatorToolsOverviewHeader() {
  return (
    <CreatorToolsPageHeader
      badge="Overview"
      title="Creator Tools"
      description="A creator-facing suite for improving posting consistency, clarifying what content is working, and helping creators show up at the right moment to drive community engagement and pageview growth."
      primaryBadgeIcon={Sparkles}
    />
  );
}
