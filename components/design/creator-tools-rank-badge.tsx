import { cn } from "@/lib/utils";

export function CreatorToolsRankBadge({
  rank,
  className,
}: {
  rank: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-border/60 bg-background px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
        className
      )}
    >
      #{rank}
    </span>
  );
}
