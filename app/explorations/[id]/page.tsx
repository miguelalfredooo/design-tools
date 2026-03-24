"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  Eye,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useExplorationSessionPage } from "@/hooks/use-exploration-session-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoterIdentityDialog } from "@/components/design/voter-identity-dialog";
import { AddOptionDialog } from "@/components/design/add-option-dialog";
import { SessionBriefTabContent } from "@/components/design/session-brief-tab-content";
import { SessionDesignPlanTabContent } from "@/components/design/session-design-plan-tab-content";
import { SessionResearchTabContent } from "@/components/design/session-research-tab-content";

export default function ExplorationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
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
    updateSessionValidation,
    setParticipantCount,
    pinVote,
    undoVote,
  } = useExplorationSessionPage(id);

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

  return (
    <div>
      {/* Dialogs */}
      <VoterIdentityDialog
        open={showIdentity}
        onSubmit={handleIdentitySubmit}
        onCancel={handleIdentityCancel}
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
          </div>

          <Tabs defaultValue="design-plan" className="gap-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="brief">PRD / Brief</TabsTrigger>
              <TabsTrigger value="design-plan">Design Plan</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
            </TabsList>

            <TabsContent value="brief" className="space-y-4">
              <SessionBriefTabContent
                session={session}
                isCreator={isCreator}
                onUpdateValidation={(updates) =>
                  updateSessionValidation(session.id, updates)
                }
              />
            </TabsContent>

            <TabsContent value="design-plan" className="space-y-8">
              <SessionDesignPlanTabContent
                session={session}
                isCreator={isCreator}
                hasVoted={hasVoted}
                voterName={voterName}
                participantCount={participantCount}
                voteCount={voteCount}
                displayOptions={displayOptions}
                winnerIds={winnerIds}
                myVoteOptionId={myVote?.optionId}
                pinnedCommentByOptionId={pinnedCommentByOptionId}
                onSetParticipantCount={setParticipantCount}
                onStartVoting={handleStartVoting}
                onReset={handleReset}
                onClearIdentity={handleIdentityReset}
                onPinVote={async (voteId, pinned) => {
                  try {
                    await pinVote(voteId, pinned);
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Failed to pin comment");
                  }
                }}
                onVote={handleOptionSelect}
                onUndoVote={undoVote}
              />
            </TabsContent>

            <TabsContent value="research" className="space-y-4">
              <SessionResearchTabContent
                session={session}
                isCreator={isCreator}
                insights={insights}
                onReloadInsights={reloadInsights}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
