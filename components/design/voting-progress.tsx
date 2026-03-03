"use client";

import { Progress } from "@/components/ui/progress";

interface VotingProgressProps {
  voteCount: number;
  participantCount: number;
}

export function VotingProgress({ voteCount, participantCount }: VotingProgressProps) {
  const pct = participantCount > 0 ? (voteCount / participantCount) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {voteCount} of {participantCount} votes cast
        </span>
        <span className="font-medium tabular-nums">{Math.round(pct)}%</span>
      </div>
      <Progress value={pct} />
    </div>
  );
}
