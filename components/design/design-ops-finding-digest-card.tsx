"use client";

import type { LucideIcon } from "lucide-react";

export function DesignOpsFindingDigestCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  items,
  emptyState,
  accentClass,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
  emptyState: string;
  accentClass: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center gap-2">
        <div className={`flex size-8 items-center justify-center rounded-full bg-background ${accentClass}`}>
          <Icon className="size-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </p>
          <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((line, index) => (
            <div key={`${title}-${index}`} className="flex items-start gap-3">
              <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${accentClass}`}>
                {index + 1}
              </div>
              <p className="text-sm leading-6 text-foreground/90">{line}</p>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">{emptyState}</p>
        )}
      </div>
    </div>
  );
}
