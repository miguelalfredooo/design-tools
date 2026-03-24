"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DesignOpsFindingSection({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        {title ? (
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
        ) : null}
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="rounded-2xl border border-border/60 bg-background p-4">
        {children}
      </div>
    </section>
  );
}
