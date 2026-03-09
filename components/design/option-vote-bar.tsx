"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import type {
  ExplorationSession,
  ExplorationOption,
} from "@/lib/design-types";
import { useSessions } from "@/lib/design-store";
import { useVoterIdentity } from "@/hooks/use-voter-identity";
import { Button } from "@/components/ui/button";
import { VoterIdentityDialog } from "@/components/design/voter-identity-dialog";

interface OptionVoteBarProps {
  session: ExplorationSession;
  option: ExplorationOption;
}

export function OptionVoteBar({ session, option }: OptionVoteBarProps) {
  const { castVote } = useSessions();
  const {
    name: voterName,
    setName: setVoterName,
    voterId,
  } = useVoterIdentity();

  const [showIdentity, setShowIdentity] = useState(false);

  const { phase, votes } = session;
  const hasVoted = votes.some((v) => v.voterId === voterId);
  const myVote = votes.find((v) => v.voterId === voterId);
  const votedForThis = myVote?.optionId === option.id;

  function handleVoteClick() {
    if (hasVoted || phase !== "voting") return;
    if (!voterName) {
      setShowIdentity(true);
    } else {
      castVoteDirectly(voterName);
    }
  }

  async function castVoteDirectly(name: string) {
    try {
      await castVote(session.id, option.id, name);
      toast.success("Vote cast!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cast vote"
      );
    }
  }

  return (
    <>
      {phase === "voting" && (
        <VoterIdentityDialog
          open={showIdentity}
          onSubmit={(name) => {
            setVoterName(name);
            setShowIdentity(false);
            castVoteDirectly(name);
          }}
          onCancel={() => setShowIdentity(false)}
          existingNames={votes.map((v) => v.voterName)}
        />
      )}

      <div className="space-y-3 mb-3 pt-2">
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
