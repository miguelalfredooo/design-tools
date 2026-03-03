"use client";

import { useState } from "react";
import { Check, Heart, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type {
  ExplorationSession,
  ExplorationOption,
  EffortLevel,
} from "@/lib/design-types";
import { cn } from "@/lib/utils";
import { useSessions } from "@/lib/design-store";
import { useVoterIdentity } from "@/hooks/use-voter-identity";
import { Button } from "@/components/ui/button";
import { VoterIdentityDialog } from "@/components/design/voter-identity-dialog";
import { VoteConfirmDialog } from "@/components/design/vote-confirm-dialog";

interface OptionVoteBarProps {
  session: ExplorationSession;
  option: ExplorationOption;
}

export function OptionVoteBar({ session, option }: OptionVoteBarProps) {
  const { castVote, comments } = useSessions();
  const {
    name: voterName,
    setName: setVoterName,
    voterId,
  } = useVoterIdentity();

  const [showConfirm, setShowConfirm] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);

  const { phase, votes } = session;
  const hasVoted = votes.some((v) => v.voterId === voterId);
  const myVote = votes.find((v) => v.voterId === voterId);
  const votedForThis = myVote?.optionId === option.id;

  const optionVotes = votes.filter((v) => v.optionId === option.id);
  const commentCount = comments.filter((c) => c.optionId === option.id).length;
  const voteCount = optionVotes.length;

  function handleVoteClick() {
    if (hasVoted || phase !== "voting") return;
    if (!voterName) {
      setShowIdentity(true);
    } else {
      setShowConfirm(true);
    }
  }

  async function handleConfirmVote(
    comment: string,
    effort?: EffortLevel,
    impact?: EffortLevel
  ) {
    if (!voterName) return;
    try {
      await castVote(
        session.id,
        option.id,
        voterName,
        comment || undefined,
        effort,
        impact
      );
      toast.success("Vote cast!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cast vote"
      );
    }
    setShowConfirm(false);
  }

  return (
    <>
      {phase === "voting" && (
        <>
          <VoterIdentityDialog
            open={showIdentity}
            onSubmit={(name) => {
              setVoterName(name);
              setShowIdentity(false);
              setShowConfirm(true);
            }}
            onCancel={() => setShowIdentity(false)}
            existingNames={votes.map((v) => v.voterName)}
          />
          <VoteConfirmDialog
            open={showConfirm}
            optionTitle={option.title}
            onConfirm={handleConfirmVote}
            onCancel={() => setShowConfirm(false)}
          />
        </>
      )}

      <div className="space-y-3 mb-3 pt-2">
        {/* Engagement row: vote count LEFT, comment count RIGHT */}
        <div className="flex items-center justify-between text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Heart
              className={cn(
                "size-[18px]",
                (votedForThis || voteCount > 0) && "fill-current text-foreground"
              )}
            />
            <span className="text-sm">
              {voteCount} {voteCount === 1 ? "vote" : "votes"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageCircle className="size-[18px]" />
            <span className="text-sm">
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>

        {/* Vote action (only during voting phase) */}
        {phase === "voting" && (
          votedForThis ? (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Check className="size-4" />
              <span className="font-medium">You voted for this option</span>
            </div>
          ) : hasVoted ? (
            <p className="text-sm text-muted-foreground">
              You voted for a different option
            </p>
          ) : (
            <Button className="w-full" onClick={handleVoteClick}>
              Vote for this option
            </Button>
          )
        )}
      </div>
    </>
  );
}
