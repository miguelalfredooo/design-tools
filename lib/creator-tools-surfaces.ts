import { cn } from "@/lib/utils";

const CREATOR_TOOLS_SURFACE_BASE =
  "border border-border/60 p-4 md:p-5";

export const creatorToolsSectionSurfaceClass = cn(
  "rounded-[28px] bg-background/90",
  CREATOR_TOOLS_SURFACE_BASE
);

export const creatorToolsInsetSurfaceClass = cn(
  "rounded-[24px] bg-card/85",
  CREATOR_TOOLS_SURFACE_BASE
);

export const creatorToolsMutedSurfaceClass = cn(
  "rounded-[24px] bg-secondary/20",
  CREATOR_TOOLS_SURFACE_BASE
);

export const creatorToolsLeadSurfaceClass = cn(
  "rounded-[28px] bg-primary/95 text-primary-foreground",
  CREATOR_TOOLS_SURFACE_BASE
);

export const creatorToolsInteractiveSurfaceClass = cn(
  "rounded-[24px] bg-background/85 transition-colors hover:border-primary/30 hover:bg-secondary/20",
  CREATOR_TOOLS_SURFACE_BASE
);
