"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessions } from "@/lib/design-store";
import { useVoterIdentity } from "@/hooks/use-voter-identity";

interface HeartReactionProps {
  sessionId: string;
  optionId: string;
  className?: string;
}

export function HeartReaction({ sessionId, optionId, className }: HeartReactionProps) {
  const { reactions, toggleReaction } = useSessions();
  const { voterId } = useVoterIdentity();
  const optionReactions = reactions.filter((r) => r.optionId === optionId);
  const count = optionReactions.length;
  const hasReacted = optionReactions.some((r) => r.voterId === voterId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleReaction(sessionId, optionId);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-1.5 transition-colors",
        hasReacted
          ? "text-red-500"
          : "text-muted-foreground hover:text-red-400",
        className
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-transform active:scale-125",
          hasReacted && "fill-current"
        )}
      />
      <span className="text-xs tabular-nums">{count}</span>
    </button>
  );
}
