import type { ReactNode } from "react";
import { creatorToolsInsetSurfaceClass } from "@/lib/creator-tools-surfaces";
import { cn } from "@/lib/utils";

export function CreatorToolsDocCard({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(creatorToolsInsetSurfaceClass, className)}>
      {title ? <h2 className="text-lg font-bold tracking-tight">{title}</h2> : null}
      <div className={cn(title ? "mt-4" : undefined)}>{children}</div>
    </section>
  );
}
