"use client";

import type { ComponentType, ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { CreatorToolsPrototypeNav } from "@/components/design/creator-tools-prototype-nav";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { getCreatorToolsPillClass } from "@/lib/creator-tools-pill";

export function CreatorToolsPageHeader({
  badge,
  title,
  description,
  actions,
  primaryBadgeLabel = "Project Drop",
  primaryBadgeIcon: PrimaryBadgeIcon = Sparkles,
}: {
  badge: string;
  title: string;
  description: string;
  actions?: ReactNode;
  primaryBadgeLabel?: string;
  primaryBadgeIcon?: ComponentType<{ className?: string }>;
}) {
  return (
    <FadeIn className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4 md:min-h-[136px]">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
              <PrimaryBadgeIcon className="size-3.5" />
              {primaryBadgeLabel}
            </Badge>
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 ${getCreatorToolsPillClass(badge)}`}
            >
              {badge}
            </Badge>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <CreatorToolsPrototypeNav />
    </FadeIn>
  );
}
