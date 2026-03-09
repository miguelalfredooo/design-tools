import { Figma, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExplorationOption } from "@/lib/design-types";

interface OptionMediaProps {
  option: ExplorationOption;
  /** Size variant for different contexts */
  variant?: "compact" | "default";
  className?: string;
}

export function OptionMedia({ option, variant = "default", className }: OptionMediaProps) {
  const { mediaType, mediaUrl, title } = option;

  if (!mediaUrl || mediaType === "none") return null;

  const isCompact = variant === "compact";

  if (mediaType === "image") {
    return (
      <div className={cn("rounded-lg overflow-hidden", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mediaUrl}
          alt={title}
          className={cn(
            "w-full object-cover",
            isCompact ? "h-auto max-h-60" : "h-[427px]"
          )}
        />
      </div>
    );
  }

  if (mediaType === "figma-embed") {
    return (
      <div className={cn(
        "flex items-center gap-2 rounded-lg border bg-muted/30",
        isCompact ? "px-3 py-2.5" : "px-4 py-3",
        className
      )}>
        <Figma className={cn("shrink-0", isCompact ? "size-4" : "size-5")} />
        <span className={cn("text-muted-foreground truncate", isCompact ? "text-xs" : "text-sm")}>
          Figma design
        </span>
      </div>
    );
  }

  if (mediaType === "excalidraw") {
    return (
      <div className={cn(
        "flex items-center gap-2 rounded-lg border bg-muted/30",
        isCompact ? "px-3 py-2.5" : "px-4 py-3",
        className
      )}>
        <PenLine className={cn("shrink-0", isCompact ? "size-4" : "size-5")} />
        <span className={cn("text-muted-foreground truncate", isCompact ? "text-xs" : "text-sm")}>
          Excalidraw sketch
        </span>
      </div>
    );
  }

  return null;
}
