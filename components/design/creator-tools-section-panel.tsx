import type { ComponentType, ReactNode } from "react";
import { creatorToolsSectionSurfaceClass } from "@/lib/creator-tools-surfaces";
import { cn } from "@/lib/utils";

export function CreatorToolsSectionPanel({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(creatorToolsSectionSurfaceClass, className)}>
      {(title || Icon) && (
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="size-4 text-primary" /> : null}
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {title}
          </p>
        </div>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}
