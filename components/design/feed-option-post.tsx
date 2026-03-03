"use client";

import Link from "next/link";
import { Figma, Heart, MessageCircle, PenLine, Trophy } from "lucide-react";
import type { ExplorationOption, Phase } from "@/lib/design-types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSessions } from "@/lib/design-store";
import { CommentInput } from "@/components/design/comment-input";

interface FeedOptionPostProps {
  option: ExplorationOption;
  sessionId: string;
  phase: Phase;
  isWinner?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function FeedOptionPost({ option, sessionId, phase, isWinner }: FeedOptionPostProps) {
  const { comments } = useSessions();
  const commentCount = comments.filter((c) => c.optionId === option.id).length;
  const initials = getInitials(option.title);

  return (
    <div>
      {/* Author row */}
      <Link
        href={`/explorations/${sessionId}/options/${option.id}`}
        className="flex items-center gap-3 mb-3 group"
      >
        <div className="size-9 rounded-full bg-[#4a4340] flex items-center justify-center text-xs font-semibold text-white shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold leading-tight group-hover:underline truncate">
              {option.title}
            </p>
            {isWinner && (
              <Badge variant="outline" className="shrink-0 gap-1 text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-400">
                <Trophy className="size-2.5" />
                Winner
              </Badge>
            )}
          </div>
        </div>
      </Link>

      {/* Media */}
      {option.mediaType === "image" && option.mediaUrl && (
        <Link href={`/explorations/${sessionId}/options/${option.id}`}>
          <div className="mb-3 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={option.mediaUrl}
              alt={option.title}
              className="w-full h-[427px] object-cover"
            />
          </div>
        </Link>
      )}

      {option.mediaType === "figma-embed" && option.mediaUrl && (
        <Link href={`/explorations/${sessionId}/options/${option.id}`}>
          <div className="mb-3 flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
            <Figma className="size-5 shrink-0" />
            <span className="text-sm text-muted-foreground truncate">Figma design</span>
          </div>
        </Link>
      )}

      {option.mediaType === "excalidraw" && option.mediaUrl && (
        <Link href={`/explorations/${sessionId}/options/${option.id}`}>
          <div className="mb-3 flex items-center gap-2 rounded-lg border bg-muted/30 px-4 py-3">
            <PenLine className="size-5 shrink-0" />
            <span className="text-sm text-muted-foreground truncate">Excalidraw sketch</span>
          </div>
        </Link>
      )}

      {/* Body */}
      {option.description && (
        <p className="text-sm leading-relaxed mb-3 line-clamp-3">
          {option.description}
        </p>
      )}

      <div className="border-t my-3" />

      {/* Engagement row */}
      <div className="flex items-center justify-between text-muted-foreground py-1.5">
        <div className="flex items-center gap-1.5">
          <Heart className="size-4" />
          <span className="text-xs">0 votes</span>
        </div>
        <Link
          href={`/explorations/${sessionId}/options/${option.id}`}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <MessageCircle className="size-4" />
          <span className="text-xs">
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </span>
        </Link>
      </div>

      <div className="border-t my-3" />

      {/* Comment input */}
      <CommentInput sessionId={sessionId} optionId={option.id} />
    </div>
  );
}
