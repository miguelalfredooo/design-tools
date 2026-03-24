"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import type { ExplorationOption } from "@/lib/design-types";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/design-utils";
import { OptionMedia } from "@/components/design/option-media";

interface FeedOptionPostProps {
  option: ExplorationOption;
  sessionId: string;
  isWinner?: boolean;
}

export function FeedOptionPost({ option, sessionId, isWinner }: FeedOptionPostProps) {
  return (
    <div className="rounded-xl border bg-card p-4">
      {/* Media */}
      <Link href={`/explorations/${sessionId}/options/${option.id}`}>
        <OptionMedia option={option} className="mb-3" />
      </Link>

      {/* Title + winner badge */}
      <Link
        href={`/explorations/${sessionId}/options/${option.id}`}
        className="flex items-center gap-2 mb-1 group"
      >
        <p className="text-sm font-semibold leading-tight group-hover:underline truncate">
          {option.title}
        </p>
        {isWinner && (
          <Badge variant="outline" className="shrink-0 gap-1 text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-400">
            <Trophy className="size-2.5" />
            Winner
          </Badge>
        )}
      </Link>

      {/* Body */}
      {option.description && (
        <p className="text-sm leading-relaxed mb-2 line-clamp-3 text-muted-foreground">
          {option.description}
        </p>
      )}

      {/* Suggested by (user attribution) */}
      {option.suggested && option.suggestedBy && (
        <div className="flex items-center gap-2">
          <div className="size-5 rounded-full bg-muted-foreground flex items-center justify-center text-[8px] font-semibold text-background shrink-0">
            {getInitials(option.suggestedBy)}
          </div>
          <p className="text-xs text-muted-foreground">
            {option.suggestedBy}
          </p>
        </div>
      )}

    </div>
  );
}
