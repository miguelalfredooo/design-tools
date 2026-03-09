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
import { useSessionInsights } from "@/hooks/use-session-insights";
import { useVoterIdentity } from "@/hooks/use-voter-identity";
import { useIsCreator } from "@/hooks/use-creator-identity";
import { seededShuffle } from "@/lib/design-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VotingProgress } from "@/components/design/voting-progress";
import { ResultsReveal } from "@/components/design/results-reveal";
import { VoterIdentityDialog } from "@/components/design/voter-identity-dialog";
import { AddOptionDialog } from "@/components/design/add-option-dialog";
import { VotingOptionCard } from "@/components/design/voting-option-card";
import { SessionBrief } from "@/components/design/session-brief";
import { SuggestOptionDialog } from "@/components/design/suggest-option-dialog";
import { SynthesizeButton } from "@/components/design/synthesize-button";
import { SessionInsights } from "@/components/design/session-insights";

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
    undoVote,
    pinVote,
    resetSession,
    revealResults,
    setParticipantCount,
    deleteSession,
    loadReactions,
  } = useSessions();
  const { name: voterName, setName: setVoterName, clearName, voterId } = useVoterIdentity();
  const isCreator = useIsCreator(session);
  const { insights, reload: reloadInsights } = useSessionInsights(id);

  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
  const [showIdentity, setShowIdentity] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  // Load session and reactions on mount
  useEffect(() => {
    loadSession(id);
    loadReactions(id);
  }, [id, loadSession, loadReactions]);

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

  function handleOptionSelect(optionId: string) {
    if (hasVoted || phase !== "voting") return;
    if (!voterName) {
      setPendingOptionId(optionId);
      setShowIdentity(true);
    } else {
      castVoteDirectly(optionId, voterName);
    }
  }

  async function castVoteDirectly(optionId: string, name: string, comment?: string) {
    if (!session) return;
    try {
      await castVote(session.id, optionId, name, comment);
      toast.success("Vote cast!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cast vote");
    }
    setPendingOptionId(null);
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
    <div>
      {/* Dialogs */}
      <VoterIdentityDialog
        open={showIdentity}
        onSubmit={(name, comment) => {
          setVoterName(name);
          setShowIdentity(false);
          if (pendingOptionId) castVoteDirectly(pendingOptionId, name, comment);
        }}
        onCancel={() => {
          setShowIdentity(false);
          setPendingOptionId(null);
        }}
        existingNames={votes.map((v) => v.voterName)}
      />

      <div>
        <div className="min-w-0">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm("Delete this session?")) handleDelete();
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            {/* Context brief accordion — full width */}
            <div className="mt-4">
              <SessionBrief session={session} />
            </div>
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
                    " -- you've already voted"
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
              <ResultsReveal
                session={session}
                isCreator={isCreator}
                onPinVote={async (voteId, pinned) => {
                  try {
                    await pinVote(session.id, voteId, pinned);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to pin comment");
                  }
                }}
              />
            </div>
          )}

          {/* Session Insights */}
          {phase === "revealed" && (
            <div className="mb-8">
              {insights.length > 0 ? (
                <SessionInsights insights={insights} />
              ) : isCreator ? (
                <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/30 px-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Synthesize voter feedback into actionable insights
                  </p>
                  <SynthesizeButton
                    endpoint={`/api/design/sessions/${session.id}/synthesize`}
                    variant="outline"
                    icon="flask"
                    onComplete={reloadInsights}
                  />
                </div>
              ) : null}
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
                  isCreator={isCreator}
                  pinnedComment={votes.find((v) => v.optionId === opt.id && v.pinned && v.comment)}
                  onVote={() => handleOptionSelect(opt.id)}
                  onUndoVote={() => undoVote(session.id)}
                />
              ))}
              {phase === "voting" && !isCreator && (
                <SuggestOptionDialog sessionId={session.id} />
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
