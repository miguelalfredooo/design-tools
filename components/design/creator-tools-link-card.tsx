import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getCreatorToolsPillClass } from "@/lib/creator-tools-pill";
import { creatorToolsInteractiveSurfaceClass } from "@/lib/creator-tools-surfaces";
import { cn } from "@/lib/utils";

export function CreatorToolsLinkCard({
  href,
  title,
  description,
  badge,
  meta,
  footerLabel,
  className,
}: {
  href: string;
  title: string;
  description?: string;
  badge?: string;
  meta?: string;
  footerLabel?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group block",
        creatorToolsInteractiveSurfaceClass,
        className
      )}
    >
      {badge || meta ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {badge ? (
            <Badge
              variant="outline"
              className={`rounded-full px-3 py-1 ${getCreatorToolsPillClass(badge)}`}
            >
              {badge}
            </Badge>
          ) : <span />}
          {meta ? (
            <span className="text-sm font-medium text-primary underline-offset-4 group-hover:underline">
              {meta}
            </span>
          ) : null}
        </div>
      ) : null}
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
      {footerLabel ? (
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {footerLabel}
        </p>
      ) : null}
    </Link>
  );
}
