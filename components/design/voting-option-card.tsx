"use client";

import Link from "next/link";
import { Check, Figma, Heart, MessageCircle, PenLine, Trophy } from "lucide-react";
import type { ExplorationOption, Phase } from "@/lib/design-types";
import { cn } from "@/lib/utils";
import { useSessions } from "@/lib/design-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface VotingOptionCardProps {
  option: ExplorationOption;
  phase: Phase;
  isSelected: boolean;
  hasVoted: boolean;
  sessionId: string;
  isWinner?: boolean;
  onVote?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function VotingOptionCard({
  option,
  phase,
  isSelected,
  hasVoted,
  sessionId,
  isWinner,
  onVote,
}: VotingOptionCardProps) {
  const { comments } = useSessions();
  const commentCount = comments.filter((c) => c.optionId === option.id).length;
  const initials = getInitials(option.title);
  const showVoteButton = phase === "voting" && !hasVoted && onVote;

  return (
    <div
      className={cn(
        "relative rounded-xl border p-4 transition-all",
        isSelected && "border-primary bg-primary/5 ring-2 ring-primary/20",
        showVoteButton && "cursor-pointer hover:border-primary/50 hover:shadow-md"
      )}
      onClick={showVoteButton ? (e) => { e.preventDefault(); onVote(); } : undefined}
    >
      {/* Selected check */}
      {isSelected && (
        <div className="absolute top-3 right-3 z-10 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="size-3.5" />
        </div>
      )}

      {/* Author row */}
      <Link
        href={`/explorations/${sessionId}/options/${option.id}`}
        className="flex items-center gap-3 mb-3 group"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="size-8 rounded-full bg-[#4a4340] flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
          {initials}
        </div>
        <div className="flex items-center gap-2 min-w-0">
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
      </Link>

      {/* Media */}
      {option.mediaType === "image" && option.mediaUrl && (
        <Link
          href={`/explorations/${sessionId}/options/${option.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={option.mediaUrl}
              alt={option.title}
              className="w-full h-auto object-cover max-h-60"
            />
          </div>
        </Link>
      )}

      {option.mediaType === "figma-embed" && option.mediaUrl && (
        <Link
          href={`/explorations/${sessionId}/options/${option.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
            <Figma className="size-4 shrink-0" />
            <span className="text-xs text-muted-foreground truncate">Figma design</span>
          </div>
        </Link>
      )}

      {option.mediaType === "excalidraw" && option.mediaUrl && (
        <Link
          href={`/explorations/${sessionId}/options/${option.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-3 flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2.5">
            <PenLine className="size-4 shrink-0" />
            <span className="text-xs text-muted-foreground truncate">Excalidraw sketch</span>
          </div>
        </Link>
      )}

      {/* Body */}
      {option.description && (
        <p className="text-sm leading-relaxed mb-3 line-clamp-3">
          {option.description}
        </p>
      )}

      {/* Engagement row */}
      <div className="flex items-center justify-between text-muted-foreground py-1.5">
        <div className="flex items-center gap-1.5">
          <Heart className="size-4" />
          <span className="text-xs">0 votes</span>
        </div>
        <Link
          href={`/explorations/${sessionId}/options/${option.id}`}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="size-4" />
          <span className="text-xs">
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
          </span>
        </Link>
      </div>

      {/* Vote button */}
      {showVoteButton && (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 w-full"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onVote();
          }}
        >
          Vote for this
        </Button>
      )}
    </div>
  );
}
