"use client";

import { Trophy, Equal, MessageSquareText, Wrench, TrendingUp } from "lucide-react";
import type { ExplorationSession, EffortLevel } from "@/lib/design-types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ResultsRevealProps {
  session: ExplorationSession;
}

const effortImpactLabel: Record<string, string> = {
  low: "Low",
  medium: "Med",
  high: "High",
};

const effortImpactColor: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  high: "bg-rose-100 text-rose-700 border-rose-200",
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

export function ResultsReveal({ session }: ResultsRevealProps) {
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
              r.isWinner && "border-primary bg-primary/5 ring-1 ring-primary/20"
            )}
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
          >
            {/* Background bar */}
            <div
              className={cn(
                "absolute inset-y-0 left-0 transition-all duration-700 ease-out",
                r.isWinner ? "bg-primary/10" : "bg-muted/50"
              )}
              style={{
                width: `${r.percentage}%`,
                animationDelay: `${i * 100 + 200}ms`,
              }}
            />

            <div className="relative flex items-center justify-between gap-4">
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
          </div>
        ))}
      </div>

      {/* Feedback summary — shows comments attributed to voter name, but NOT which option they voted for */}
      {session.votes.some((v) => v.comment) && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquareText className="size-4 text-muted-foreground" />
            <h4 className="text-sm font-medium">Feedback</h4>
          </div>
          <div className="space-y-2 pl-3 border-l-2 border-muted">
            {session.votes
              .filter((v) => v.comment)
              .map((v) => (
                <div key={v.id} className="text-sm">
                  <p className="italic text-muted-foreground">
                    &ldquo;{v.comment}&rdquo;
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    — {v.voterName}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
