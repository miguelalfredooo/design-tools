"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Eye,
  Lock,
  Settings,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useSessions } from "@/lib/design-store";
import { useVoterIdentity } from "@/hooks/use-voter-identity";
import { useIsCreator } from "@/hooks/use-creator-identity";
import { seededShuffle } from "@/lib/design-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VotingProgress } from "@/components/design/voting-progress";
import { ResultsReveal } from "@/components/design/results-reveal";
import { VoterIdentityDialog } from "@/components/design/voter-identity-dialog";
import { VoteConfirmDialog } from "@/components/design/vote-confirm-dialog";
import { AddOptionDialog } from "@/components/design/add-option-dialog";
import { VotingOptionCard } from "@/components/design/voting-option-card";
import { SessionBrief } from "@/components/design/session-brief";

export default function ExplorationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    session,
    loading,
    loadSession,
    startVoting,
    castVote,
    resetSession,
    revealResults,
    setParticipantCount,
    deleteSession,
  } = useSessions();
  const { name: voterName, setName: setVoterName, clearName, voterId } = useVoterIdentity();
  const isCreator = useIsCreator(session);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  // Load session on mount
  useEffect(() => {
    loadSession(id);
  }, [id, loadSession]);

  if (loading && !session) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-12 text-center">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-12 text-center">
        <h1 className="text-2xl font-bold">Session not found</h1>
        <p className="mt-2 text-muted-foreground">
          This session may have been deleted.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Home
          </Link>
        </Button>
      </div>
    );
  }

  const { phase, options, votes, participantCount, voteCount } = session;
  const hasVoted = votes.some(
    (v) => v.voterId === voterId
  );
  const myVote = votes.find((v) => v.voterId === voterId);

  // Compute winners for revealed phase
  const winnerIds = new Set<string>();
  if (phase === "revealed") {
    const counts = new Map<string, number>();
    for (const v of votes) counts.set(v.optionId, (counts.get(v.optionId) ?? 0) + 1);
    const max = Math.max(0, ...counts.values());
    if (max > 0) {
      for (const [id, c] of counts) if (c === max) winnerIds.add(id);
    }
  }

  // Randomize options per voter (deterministic shuffle using voterId)
  const displayOptions =
    phase === "voting" && !isCreator
      ? seededShuffle(options, voterId)
      : options;

  const selectedOption = options.find((o) => o.id === selectedOptionId);

  function handleOptionSelect(optionId: string) {
    if (hasVoted || phase !== "voting") return;
    setSelectedOptionId(optionId);
    if (!voterName) {
      setShowIdentity(true);
    } else {
      setShowConfirm(true);
    }
  }

  async function handleConfirmVote(comment: string, effort?: string, impact?: string) {
    if (!selectedOptionId || !voterName || !session) return;
    try {
      await castVote(session.id, selectedOptionId, voterName, comment || undefined, effort, impact);
      toast.success("Vote cast!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cast vote");
    }
    setShowConfirm(false);
    setSelectedOptionId(null);
  }

  async function handleStartVoting() {
    if (!session || options.length < 2) {
      toast.error("Add at least 2 options before starting.");
      return;
    }
    try {
      await startVoting(session.id);
      toast.success("Voting is open!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start voting");
    }
  }

  async function handleReset() {
    if (!session) return;
    try {
      await resetSession(session.id);
      toast.info("Session reset to setup.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset");
    }
  }

  async function handleReveal() {
    if (!session) return;
    try {
      await revealResults(session.id);
      toast.success("Results revealed!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reveal");
    }
  }

  async function handleDelete() {
    if (!session) return;
    try {
      await deleteSession(session.id);
      toast.success("Session deleted");
      window.location.href = "/";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="pt-6 pb-12">
      {/* Dialogs */}
      <VoterIdentityDialog
        open={showIdentity}
        onSubmit={(name) => {
          setVoterName(name);
          setShowIdentity(false);
          setShowConfirm(true);
        }}
        onCancel={() => {
          setShowIdentity(false);
          setSelectedOptionId(null);
        }}
        existingNames={votes.map((v) => v.voterName)}
      />

      <VoteConfirmDialog
        open={showConfirm}
        optionTitle={selectedOption?.title ?? ""}
        onConfirm={handleConfirmVote}
        onCancel={() => {
          setShowConfirm(false);
          setSelectedOptionId(null);
        }}
      />

      {/* Two-column layout: brief left, content right */}
      <div className="flex gap-8 justify-center mx-auto">
        {/* Left column — context brief */}
        <div className="hidden lg:block w-[240px] shrink-0">
          <div className="sticky top-6">
            <SessionBrief session={session} />
          </div>
        </div>

        {/* Right column — main content */}
        <div className="flex-1 min-w-0 max-w-[720px]">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
              <Link href="/">
                <ArrowLeft className="size-4" />
                Home
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleCopyLink}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {session.title}
                  </h1>
                  <Badge
                    variant={
                      phase === "voting"
                        ? "default"
                        : phase === "revealed"
                          ? "outline"
                          : "secondary"
                    }
                  >
                    {phase === "setup"
                      ? "Setup"
                      : phase === "voting"
                        ? "Voting"
                        : "Results"}
                  </Badge>
                </div>
                {session.description && (
                  <p className="text-muted-foreground">{session.description}</p>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                {isCreator && (
                  <>
                    {phase === "setup" && (
                      <AddOptionDialog sessionId={session.id}>
                        <Button variant="outline" size="sm">
                          <Plus className="size-4" />
                          Add Option
                        </Button>
                      </AddOptionDialog>
                    )}
                    {phase === "voting" && (
                      <Button variant="outline" size="sm" onClick={handleReveal}>
                        <Eye className="size-4" />
                        Reveal Results
                      </Button>
                    )}
                    {phase === "revealed" && (
                      <Button variant="outline" size="sm" onClick={handleReset}>
                        <RotateCcw className="size-4" />
                        Reset
                      </Button>
                    )}
                    {phase === "setup" && (
                      <Button variant="ghost" size="sm" onClick={handleDelete}>
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Context brief — mobile only (shown inline when no left column) */}
          <div className="mb-8 lg:hidden">
            <SessionBrief session={session} />
          </div>

          {/* Voter count - editable by creator in setup */}
      <div className="mb-8">
        {phase === "setup" && isCreator ? (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Users className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">
                How many people are voting?
              </span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                  <Button
                    key={n}
                    variant={participantCount === n ? "default" : "outline"}
                    size="icon-xs"
                    onClick={() => setParticipantCount(session.id, n)}
                    className="w-7 h-7 text-xs tabular-nums"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleStartVoting}
              disabled={options.length < 2}
            >
              <Play className="size-4" />
              Start Voting
            </Button>
          </div>
        ) : phase === "setup" && !isCreator ? (
          // Voter waiting for voting to start
          <div className="flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-6 justify-center">
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
                  onClick={handleReset}
                >
                  <Settings className="size-3" />
                  Change
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Voting progress */}
      {(phase === "voting" || phase === "revealed") && (
        <div className="mb-8">
          <VotingProgress voteCount={voteCount} participantCount={participantCount} />
          {phase === "voting" && voterName && (
            <p className="mt-2 text-sm text-muted-foreground">
              Voting as <strong>{voterName}</strong>
              {hasVoted ? (
                " — you've already voted"
              ) : (
                <>
                  {" · "}
                  <button
                    className="font-medium text-primary hover:underline"
                    onClick={() => {
                      clearName();
                      setShowIdentity(true);
                    }}
                  >
                    Not you?
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {phase === "revealed" && (
        <div className="mb-8">
          <ResultsReveal session={session} />
        </div>
      )}

      {/* Voting instruction */}
      {phase === "voting" && !hasVoted && (
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Tap an exploration to cast your vote
        </p>
      )}

      {/* Options grid */}
      {phase !== "setup" || isCreator ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayOptions.map((opt) => (
            <VotingOptionCard
              key={opt.id}
              option={opt}
              phase={phase}
              isSelected={myVote?.optionId === opt.id}
              hasVoted={hasVoted}
              sessionId={session.id}
              isWinner={winnerIds.has(opt.id)}
              onVote={() => handleOptionSelect(opt.id)}
            />
          ))}
        </div>
      ) : null}
        </div>
      </div>
    </div>
  );
}
