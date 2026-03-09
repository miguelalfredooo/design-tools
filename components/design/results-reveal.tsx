"use client";

import { Trophy, Equal, Wrench, TrendingUp, Pin, PinOff } from "lucide-react";
import type { ExplorationSession, EffortLevel, Vote } from "@/lib/design-types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/design-utils";

interface ResultsRevealProps {
  session: ExplorationSession;
  isCreator?: boolean;
  onPinVote?: (voteId: string, pinned: boolean) => void;
}

const effortImpactLabel: Record<string, string> = {
  low: "Low",
  medium: "Med",
  high: "High",
};

const effortImpactColor: Record<string, string> = {
  low: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
  medium: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  high: "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
};

interface OptionResult {
  optionId: string;
  title: string;
  description: string;
  voteCount: number;
  percentage: number;
  rank: number;
  isWinner: boolean;
  isTied: boolean;
  avgEffort: EffortLevel | null;
  avgImpact: EffortLevel | null;
}

function averageLevel(levels: EffortLevel[]): EffortLevel | null {
  if (levels.length === 0) return null;
  const numericMap: Record<EffortLevel, number> = { low: 1, medium: 2, high: 3 };
  const avg = levels.reduce((sum, l) => sum + numericMap[l], 0) / levels.length;
  if (avg < 1.5) return "low";
  if (avg < 2.5) return "medium";
  return "high";
}

function computeResults(session: ExplorationSession): OptionResult[] {
  const counts = new Map<string, number>();
  for (const opt of session.options) {
    counts.set(opt.id, 0);
  }
  for (const vote of session.votes) {
    counts.set(vote.optionId, (counts.get(vote.optionId) ?? 0) + 1);
  }

  // Aggregate effort/impact per option from votes
  const effortsByOption = new Map<string, EffortLevel[]>();
  const impactsByOption = new Map<string, EffortLevel[]>();
  for (const vote of session.votes) {
    if (vote.effort) {
      const arr = effortsByOption.get(vote.optionId) ?? [];
      arr.push(vote.effort);
      effortsByOption.set(vote.optionId, arr);
    }
    if (vote.impact) {
      const arr = impactsByOption.get(vote.optionId) ?? [];
      arr.push(vote.impact);
      impactsByOption.set(vote.optionId, arr);
    }
  }

  const total = session.votes.length;
  const sorted = session.options
    .map((opt) => ({
      optionId: opt.id,
      title: opt.title,
      description: opt.description,
      voteCount: counts.get(opt.id) ?? 0,
      percentage: total > 0 ? ((counts.get(opt.id) ?? 0) / total) * 100 : 0,
      rank: 0,
      isWinner: false,
      isTied: false,
      avgEffort: averageLevel(effortsByOption.get(opt.id) ?? []),
      avgImpact: averageLevel(impactsByOption.get(opt.id) ?? []),
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

  let currentRank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].voteCount < sorted[i - 1].voteCount) {
      currentRank = i + 1;
    }
    sorted[i].rank = currentRank;
  }

  const topCount = sorted[0]?.voteCount ?? 0;
  const winners = sorted.filter((r) => r.voteCount === topCount);
  const hasTie = winners.length > 1 && topCount > 0;

  for (const r of sorted) {
    if (r.voteCount === topCount && topCount > 0) {
      r.isWinner = true;
      r.isTied = hasTie;
    }
  }

  return sorted;
}

export function ResultsReveal({ session, isCreator, onPinVote }: ResultsRevealProps) {
  const results = computeResults(session);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Results</h3>
      <div className="space-y-3">
        {results.map((r, i) => (
          <div
            key={r.optionId}
            className={cn(
              "relative overflow-hidden rounded-lg border p-4 transition-all",
              "animate-in fade-in slide-in-from-bottom-2",
              r.isWinner && "bg-card shadow-md ring-1 ring-foreground/5"
            )}
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {r.isWinner && (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {r.isTied ? (
                      <Equal className="size-4" />
                    ) : (
                      <Trophy className="size-4" />
                    )}
                  </div>
                )}
                <div className="min-w-0">
                  <p className={cn("font-medium truncate", r.isWinner && "text-primary")}>
                    {r.title}
                  </p>
                  {r.description && (
                    <p className="text-sm text-muted-foreground truncate">
                      {r.description}
                    </p>
                  )}
                  {(r.avgEffort || r.avgImpact) && (
                    <div className="flex items-center gap-2 mt-1">
                      {r.avgEffort && (
                        <Badge variant="outline" className={cn("text-[10px] gap-1", effortImpactColor[r.avgEffort])}>
                          <Wrench className="size-2.5" />
                          Effort: {effortImpactLabel[r.avgEffort]}
                        </Badge>
                      )}
                      {r.avgImpact && (
                        <Badge variant="outline" className={cn("text-[10px] gap-1", effortImpactColor[r.avgImpact])}>
                          <TrendingUp className="size-2.5" />
                          Impact: {effortImpactLabel[r.avgImpact]}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-right">
                <span className="text-sm text-muted-foreground">
                  {r.voteCount} {r.voteCount === 1 ? "vote" : "votes"}
                </span>
                <span className="text-lg font-semibold tabular-nums w-14 text-right">
                  {Math.round(r.percentage)}%
                </span>
              </div>
            </div>
            {/* Voter comments */}
            <VoteComments
              votes={session.votes.filter((v) => v.optionId === r.optionId && v.comment)}
              isCreator={isCreator}
              onPinVote={onPinVote}
            />
          </div>
        ))}
      </div>

    </div>
  );
}

function VoteComments({
  votes,
  isCreator,
  onPinVote,
}: {
  votes: Vote[];
  isCreator?: boolean;
  onPinVote?: (voteId: string, pinned: boolean) => void;
}) {
  if (votes.length === 0) return null;

  // Pinned comments first
  const sorted = [...votes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return (
    <div className="mt-3 space-y-2 border-t pt-3">
      {sorted.map((vote) => (
        <div
          key={vote.id}
          className={cn(
            "flex items-start gap-2 text-sm",
            vote.pinned && "bg-amber-50 dark:bg-amber-500/10 -mx-2 px-2 py-1.5 rounded-md"
          )}
        >
          {vote.pinned && (
            <Pin className="size-3 text-amber-500 shrink-0 mt-0.5" />
          )}
          <div className="size-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-semibold text-muted-foreground shrink-0 mt-0.5">
            {getInitials(vote.voterName)}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-medium text-xs">{vote.voterName}</span>
            <p className="text-muted-foreground text-xs leading-relaxed">{vote.comment}</p>
          </div>
          {isCreator && onPinVote && (
            <button
              className={cn(
                "shrink-0 p-1 rounded hover:bg-muted transition-colors",
                vote.pinned ? "text-amber-500" : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
              onClick={() => onPinVote(vote.id, !vote.pinned)}
              title={vote.pinned ? "Unpin comment" : "Pin comment"}
            >
              {vote.pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
