"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Pencil, Pin, Trash2, Trophy } from "lucide-react";
import type { ExplorationOption, Phase, Vote } from "@/lib/design-types";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/design-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSessions } from "@/lib/design-store";
import { OptionMedia } from "@/components/design/option-media";
import { EditOptionDialog } from "@/components/design/edit-option-dialog";

interface VotingOptionCardProps {
  option: ExplorationOption;
  phase: Phase;
  isSelected: boolean;
  hasVoted: boolean;
  sessionId: string;
  isWinner?: boolean;
  isCreator?: boolean;
  pinnedComment?: Vote;
  onVote?: () => void;
  onUndoVote?: () => void;
}

export function VotingOptionCard({
  option,
  phase,
  isSelected,
  hasVoted,
  sessionId,
  isWinner,
  isCreator,
  pinnedComment,
  onVote,
  onUndoVote,
}: VotingOptionCardProps) {
  const { removeOption } = useSessions();
  const [editOpen, setEditOpen] = useState(false);
  const showVoteButton = phase === "voting" && !hasVoted && onVote;

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-4 transition-all flex flex-col",
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

      {/* Creator controls */}
      {isCreator && phase !== "revealed" && !isSelected && (
        <div className="absolute top-3 right-3 z-10 flex gap-1">
          <button
            className="size-6 rounded-full bg-muted/80 text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setEditOpen(true);
            }}
          >
            <Pencil className="size-3" />
          </button>
          <button
            className="size-6 rounded-full bg-muted/80 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (window.confirm("Delete this option?")) {
                removeOption(sessionId, option.id);
              }
            }}
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      )}

      {/* Edit dialog */}
      {isCreator && (
        <EditOptionDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          sessionId={sessionId}
          option={option}
        />
      )}

      {/* Media */}
      <Link
        href={`/explorations/${sessionId}/options/${option.id}`}
        onClick={(e) => e.stopPropagation()}
      >
        <OptionMedia option={option} variant="compact" className="mb-3" />
      </Link>

      {/* Title + winner badge */}
      <Link
        href={`/explorations/${sessionId}/options/${option.id}`}
        className="flex items-center gap-2 mb-1 group"
        onClick={(e) => e.stopPropagation()}
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
        <div className="flex items-center gap-2 mb-2">
          <div className="size-5 rounded-full bg-muted-foreground flex items-center justify-center text-[8px] font-semibold text-background shrink-0">
            {getInitials(option.suggestedBy)}
          </div>
          <p className="text-xs text-muted-foreground">
            {option.suggestedBy}
          </p>
        </div>
      )}

      {/* Pinned comment — revealed phase */}
      {phase === "revealed" && pinnedComment && (
        <div className="flex items-start gap-1.5 mb-2 rounded-md bg-amber-50 dark:bg-amber-500/10 px-2.5 py-2 text-xs">
          <Pin className="size-3 text-amber-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="font-medium text-amber-700 dark:text-amber-400">{pinnedComment.voterName}</span>
            <p className="text-amber-900/70 dark:text-amber-300/70 leading-relaxed">{pinnedComment.comment}</p>
          </div>
        </div>
      )}

      {/* Vote button — pushed to bottom */}
      {phase === "voting" && (
        hasVoted && isSelected && onUndoVote ? (
          <Button
            size="sm"
            variant="default"
            className="mt-auto w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onUndoVote();
            }}
          >
            <Check className="size-3.5" />
            You voted!
          </Button>
        ) : hasVoted ? (
          <Button
            size="sm"
            variant="outline"
            className="mt-auto w-full pointer-events-none"
            disabled
          >
            You voted!
          </Button>
        ) : onVote ? (
          <Button
            size="sm"
            variant="outline"
            className="mt-auto w-full"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onVote();
            }}
          >
            Vote for this
          </Button>
        ) : null
      )}
    </div>
  );
}
