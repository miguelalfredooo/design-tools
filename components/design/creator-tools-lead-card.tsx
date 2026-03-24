import type { ReactNode } from "react";
import {
  creatorToolsLeadSurfaceClass,
  creatorToolsMutedSurfaceClass,
} from "@/lib/creator-tools-surfaces";
import { cn } from "@/lib/utils";

export function CreatorToolsLeadCard({
  eyebrow,
  title,
  description,
  details,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  details?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        creatorToolsLeadSurfaceClass,
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-xl font-black leading-8 tracking-tight md:text-2xl">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-primary-foreground/82">{description}</p>
      {details ? (
        <div
          className={cn(
            "mt-4 border-primary-foreground/15 bg-black/10 text-primary-foreground",
            creatorToolsMutedSurfaceClass
          )}
        >
          {details}
        </div>
      ) : null}
      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
