"use client";

import { Clock, Lock, Play, Settings, Users } from "lucide-react";
import type { ExplorationSession } from "@/lib/design-types";
import { Button } from "@/components/ui/button";
import { ResultsReveal } from "@/components/design/results-reveal";
import { SuggestOptionDialog } from "@/components/design/suggest-option-dialog";
import { VotingOptionCard } from "@/components/design/voting-option-card";
import { VotingProgress } from "@/components/design/voting-progress";

export function SessionDesignPlanTabContent({
  session,
  isCreator,
  hasVoted,
  voterName,
  participantCount,
  voteCount,
  displayOptions,
  winnerIds,
  myVoteOptionId,
  pinnedCommentByOptionId,
  onSetParticipantCount,
  onStartVoting,
  onReset,
  onClearIdentity,
  onPinVote,
  onVote,
  onUndoVote,
}: {
  session: ExplorationSession;
  isCreator: boolean;
  hasVoted: boolean;
  voterName: string;
  participantCount: number;
  voteCount: number;
  displayOptions: ExplorationSession["options"];
  winnerIds: Set<string>;
  myVoteOptionId?: string;
  pinnedCommentByOptionId: Map<string, ExplorationSession["votes"][number]>;
  onSetParticipantCount: (count: number) => Promise<void>;
  onStartVoting: () => Promise<void>;
  onReset: () => Promise<void>;
  onClearIdentity: () => void;
  onPinVote: (voteId: string, pinned: boolean) => Promise<void>;
  onVote: (optionId: string) => void;
  onUndoVote: () => Promise<void>;
}) {
  const { phase, options } = session;

  return (
    <div className="space-y-8">
      <div>
        {phase === "setup" && isCreator ? (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Users className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium">How many people are voting?</span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                  <Button
                    key={n}
                    variant={participantCount === n ? "default" : "outline"}
                    size="icon-xs"
                    onClick={() => onSetParticipantCount(n)}
                    className="h-7 w-7 text-xs tabular-nums"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => void onStartVoting()}
              disabled={options.length < 2}
            >
              <Play className="size-4" />
              Start Voting
            </Button>
          </div>
        ) : phase === "setup" && !isCreator ? (
          <div className="flex items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-6">
            <Clock className="size-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Waiting for the session creator to start voting...
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-3.5" />
            <span>
              {participantCount} {participantCount === 1 ? "voter" : "voters"}
            </span>
            {isCreator && (
              <>
                <span className="text-border">·</span>
                <button
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  onClick={() => void onReset()}
                >
                  <Settings className="size-3" />
                  Change
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {(phase === "voting" || phase === "revealed") && (
        <div>
          <VotingProgress voteCount={voteCount} participantCount={participantCount} />
          {phase === "voting" && voterName && (
            <p className="mt-2 text-sm text-muted-foreground">
              Voting as <strong>{voterName}</strong>
              {hasVoted ? (
                " -- you've already voted"
              ) : (
                <>
                  {" · "}
                  <button
                    className="font-medium text-primary hover:underline"
                    onClick={onClearIdentity}
                  >
                    Not you?
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      )}

      {phase === "revealed" && (
        <ResultsReveal
          session={session}
          isCreator={isCreator}
          onPinVote={onPinVote}
        />
      )}

      {phase === "voting" && !hasVoted && (
        <p className="text-sm font-medium text-muted-foreground">
          Tap an exploration to cast your vote
        </p>
      )}

      {phase !== "setup" || isCreator ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {displayOptions.map((opt) => (
            <VotingOptionCard
              key={opt.id}
              option={opt}
              phase={phase}
              isSelected={myVoteOptionId === opt.id}
              hasVoted={hasVoted}
              sessionId={session.id}
              isWinner={winnerIds.has(opt.id)}
              isCreator={isCreator}
              pinnedComment={pinnedCommentByOptionId.get(opt.id)}
              onVote={() => onVote(opt.id)}
              onUndoVote={() => void onUndoVote()}
            />
          ))}
          {phase === "voting" && !isCreator && <SuggestOptionDialog sessionId={session.id} />}
        </div>
      ) : null}
    </div>
  );
}
