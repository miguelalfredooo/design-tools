"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { seededShuffle } from "@/lib/design-utils";
import { useSessions } from "@/lib/design-store";
import { useSessionInsights } from "@/hooks/use-session-insights";
import { useVoterIdentity } from "@/hooks/use-voter-identity";
import { useIsCreator } from "@/hooks/use-creator-identity";
import type { SessionValidation } from "@/lib/design-types";

const EMPTY_OPTIONS: NonNullable<ReturnType<typeof useSessions>["session"]>["options"] = [];
const EMPTY_VOTES: NonNullable<ReturnType<typeof useSessions>["session"]>["votes"] = [];

export function useExplorationSessionPage(id: string) {
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
    updateSessionValidation,
  } = useSessions();
  const { name: voterName, setName: setVoterName, clearName, voterId } =
    useVoterIdentity();
  const isCreator = useIsCreator(session);
  const { insights, reload: reloadInsights } = useSessionInsights(id);

  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
  const [showIdentity, setShowIdentity] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSession(id);
    loadReactions(id);
  }, [id, loadSession, loadReactions]);

  // Show name dialog on first load if session is in voting phase and user has no name
  useEffect(() => {
    if (!session || isCreator || voterName) return;
    if (session.phase === "voting") {
      setShowIdentity(true);
    }
  }, [session?.phase, isCreator, voterName]);

  const phase = session?.phase;
  const options = session?.options ?? EMPTY_OPTIONS;
  const votes = session?.votes ?? EMPTY_VOTES;
  const participantCount = session?.participantCount ?? 0;
  const voteCount = session?.voteCount ?? 0;
  const hasVoted = votes.some((vote) => vote.voterId === voterId);
  const myVote = votes.find((vote) => vote.voterId === voterId);

  const winnerIds = useMemo(() => {
    const winners = new Set<string>();
    if (phase !== "revealed") return winners;

    const counts = new Map<string, number>();
    for (const vote of votes) {
      counts.set(vote.optionId, (counts.get(vote.optionId) ?? 0) + 1);
    }

    const max = Math.max(0, ...counts.values());
    if (max > 0) {
      for (const [optionId, count] of counts) {
        if (count === max) winners.add(optionId);
      }
    }

    return winners;
  }, [phase, votes]);

  const displayOptions =
    phase === "voting" && !isCreator ? seededShuffle(options, voterId) : options;

  const pinnedCommentByOptionId = useMemo(
    () =>
      new Map(
        votes
          .filter((vote) => vote.pinned && vote.comment)
          .map((vote) => [vote.optionId, vote])
      ),
    [votes]
  );

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  async function castVoteDirectly(
    optionId: string,
    name: string,
    comment?: string
  ) {
    if (!session) return;
    try {
      await castVote(session.id, optionId, name, comment);
      toast.success("Vote cast!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cast vote");
    }
    setPendingOptionId(null);
  }

  function handleOptionSelect(optionId: string) {
    if (hasVoted || phase !== "voting") return;
    if (!voterName) {
      setPendingOptionId(optionId);
      setShowIdentity(true);
      return;
    }
    void castVoteDirectly(optionId, voterName);
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

  function handleIdentitySubmit(name: string, comment?: string) {
    setVoterName(name);
    setShowIdentity(false);
    if (pendingOptionId) {
      void castVoteDirectly(pendingOptionId, name, comment);
    }
  }

  function handleIdentityCancel() {
    setShowIdentity(false);
    setPendingOptionId(null);
  }

  function handleIdentityReset() {
    clearName();
    setShowIdentity(true);
  }

  return {
    session,
    loading,
    isCreator,
    insights,
    reloadInsights,
    voterName,
    votes,
    phase,
    participantCount,
    voteCount,
    hasVoted,
    myVote,
    winnerIds,
    displayOptions,
    pinnedCommentByOptionId,
    showIdentity,
    copied,
    handleCopyLink,
    handleOptionSelect,
    handleStartVoting,
    handleReset,
    handleReveal,
    handleDelete,
    handleIdentitySubmit,
    handleIdentityCancel,
    handleIdentityReset,
    updateSessionValidation: (updates: Partial<SessionValidation>) =>
      session ? updateSessionValidation(session.id, updates) : Promise.resolve(),
    setParticipantCount: (count: number) =>
      session ? setParticipantCount(session.id, count) : Promise.resolve(),
    pinVote: (voteId: string, pinned: boolean) =>
      session ? pinVote(session.id, voteId, pinned) : Promise.resolve(),
    undoVote: () => (session ? undoVote(session.id) : Promise.resolve()),
  };
}
