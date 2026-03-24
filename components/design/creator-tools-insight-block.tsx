import type { ComponentType } from "react";
import { Badge } from "@/components/ui/badge";
import { getCreatorToolsPillClass } from "@/lib/creator-tools-pill";

export function CreatorToolsInsightBlock({
  badge,
  icon: Icon,
  insight,
  supportingLabel,
  supportingText,
}: {
  badge: string;
  icon: ComponentType<{ className?: string }>;
  insight: string;
  supportingLabel: string;
  supportingText: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-secondary/35 text-foreground">
          <Icon className="size-4" />
        </span>
        <Badge
          variant="outline"
          className={`rounded-full px-3 py-1 ${getCreatorToolsPillClass(badge)}`}
        >
          {badge}
        </Badge>
      </div>
      <p className="mt-4 text-base font-bold leading-7 tracking-tight text-foreground">
        {insight}
      </p>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {supportingLabel}
      </p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{supportingText}</p>
    </div>
  );
}
