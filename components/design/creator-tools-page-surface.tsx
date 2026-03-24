import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CreatorToolsPageSurface({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "gradient";
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[32px] border border-border/70 shadow-sm",
        tone === "gradient"
          ? "bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(244,244,245,0.98))] dark:bg-[linear-gradient(180deg,_rgba(24,24,27,0.96),_rgba(39,39,42,0.98))]"
          : "bg-card",
        className
      )}
    >
      {children}
    </section>
  );
}
