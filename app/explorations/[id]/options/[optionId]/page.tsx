"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSessions, getVoterId } from "@/lib/design-store";
import { useIsCreator } from "@/hooks/use-creator-identity";
import { useVoterIdentity } from "@/hooks/use-voter-identity";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { OptionVoteBar } from "@/components/design/option-vote-bar";
import { SpatialCommentLayer, CommentPanel } from "@/components/design/spatial-comment-layer";
import { VoterIdentityDialog } from "@/components/design/voter-identity-dialog";

export default function OptionDetailPage({
  params,
}: {
  params: Promise<{ id: string; optionId: string }>;
}) {
  const { id, optionId } = use(params);
  const router = useRouter();
  const {
    session, loading, loadSession, loadReactions, removeOption,
    spatialComments, loadSpatialComments, addSpatialComment, deleteSpatialComment,
  } = useSessions();
  const isCreator = useIsCreator(session);
  const { name: voterName, setName: setVoterName, voterId } = useVoterIdentity();
  const [showIdentity, setShowIdentity] = useState(false);
  const [pendingComment, setPendingComment] = useState<{ body: string; xPct: number; yPct: number } | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    loadSession(id);
    loadReactions(id);
    loadSpatialComments(id, optionId);
  }, [id, optionId, loadSession, loadReactions, loadSpatialComments]);

  // Realtime subscription for spatial comments
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`spatial-comments:${optionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "design_comments",
          filter: `option_id=eq.${optionId}`,
        },
        () => {
          loadSpatialComments(id, optionId);
        }
      )
      .subscribe();

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [id, optionId, loadSpatialComments]);

  const handleAddComment = useCallback(
    async (body: string, xPct: number, yPct: number) => {
      if (!voterName) {
        setPendingComment({ body, xPct, yPct });
        setShowIdentity(true);
        return;
      }
      try {
        await addSpatialComment(id, {
          optionId,
          voterId: getVoterId(),
          voterName,
          body,
          xPct,
          yPct,
        });
      } catch {
        toast.error("Failed to add comment");
      }
    },
    [id, optionId, voterName, addSpatialComment]
  );

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      try {
        await deleteSpatialComment(id, optionId, commentId);
      } catch {
        toast.error("Failed to delete comment");
      }
    },
    [id, optionId, deleteSpatialComment]
  );

  if (loading && !session) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="w-full py-12 text-center">
        <h1 className="text-2xl font-bold">Session not found</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Home
          </Link>
        </Button>
      </div>
    );
  }

  const option = session.options.find((o) => o.id === optionId);

  if (!option) {
    return (
      <div className="w-full py-12 text-center">
        <h1 className="text-2xl font-bold">Option not found</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/explorations/${id}`}>
            <ArrowLeft className="size-4" />
            Back to {session.title}
          </Link>
        </Button>
      </div>
    );
  }

  const createdDate = new Date(session.createdAt);
  const timeAgo = formatTimeAgo(createdDate);

  return (
    <div className="overflow-hidden">
      {/* Identity dialog for spatial comments */}
      <VoterIdentityDialog
        open={showIdentity}
        context="comment"
        onSubmit={(name) => {
          setVoterName(name);
          setShowIdentity(false);
          if (pendingComment) {
            addSpatialComment(id, {
              optionId,
              voterId: getVoterId(),
              voterName: name,
              body: pendingComment.body,
              xPct: pendingComment.xPct,
              yPct: pendingComment.yPct,
            }).catch(() => toast.error("Failed to add comment"));
            setPendingComment(null);
          }
        }}
        onCancel={() => {
          setShowIdentity(false);
          setPendingComment(null);
        }}
        existingNames={[]}
      />

      <div className="w-full flex items-center justify-between mb-6">
        {/* Back navigation */}
        <Link
          href={`/explorations/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          {session.title}
        </Link>

        {/* Prev / Next option */}
        {(() => {
          const sortedOptions = [...session.options].sort((a, b) => a.position - b.position);
          const currentIdx = sortedOptions.findIndex((o) => o.id === optionId);
          const prev = currentIdx > 0 ? sortedOptions[currentIdx - 1] : null;
          const next = currentIdx < sortedOptions.length - 1 ? sortedOptions[currentIdx + 1] : null;
          return (
            <div className="flex items-center gap-1">
              {prev ? (
                <Link
                  href={`/explorations/${id}/options/${prev.id}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                >
                  <ChevronLeft className="size-4" />
                  Prev
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground/40 px-2 py-1">
                  <ChevronLeft className="size-4" />
                  Prev
                </span>
              )}
              <span className="text-xs text-muted-foreground tabular-nums">
                {currentIdx + 1}/{sortedOptions.length}
              </span>
              {next ? (
                <Link
                  href={`/explorations/${id}/options/${next.id}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                >
                  Next
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground/40 px-2 py-1">
                  Next
                  <ChevronRight className="size-4" />
                </span>
              )}
            </div>
          );
        })()}
      </div>

      {/* ── Media with spatial comment overlay ──────────────── */}
      {option.mediaType === "image" && option.mediaUrl && (
        <div className="w-full mb-4">
          <div className="relative rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={option.mediaUrl}
              alt={option.title}
              className="w-full h-auto object-cover"
            />
            <SpatialCommentLayer
              comments={spatialComments}
              onAdd={handleAddComment}
              onDelete={handleDeleteComment}
              isCreator={isCreator}
              currentVoterId={voterId}
              disableCreate={isMobile}
            />
          </div>
        </div>
      )}

      {option.mediaType === "figma-embed" && option.mediaUrl && (
        <div className="relative mb-4 rounded-2xl overflow-hidden">
          <iframe
            src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(option.mediaUrl)}`}
            className="w-full h-[80vh] border-0"
            allowFullScreen
          />
          <SpatialCommentLayer
            comments={spatialComments}
            onAdd={handleAddComment}
            onDelete={handleDeleteComment}
            isCreator={isCreator}
            currentVoterId={voterId}
            disableCreate={isMobile}
            highlightedId={highlightedCommentId}
          />
        </div>
      )}

      {option.mediaType === "excalidraw" && option.mediaUrl && (
        <div className="relative mb-4 rounded-2xl overflow-hidden">
          <iframe
            src={option.mediaUrl}
            className="w-full h-[80vh] border-0"
            allowFullScreen
          />
          <SpatialCommentLayer
            comments={spatialComments}
            onAdd={handleAddComment}
            onDelete={handleDeleteComment}
            isCreator={isCreator}
            currentVoterId={voterId}
            disableCreate={isMobile}
            highlightedId={highlightedCommentId}
          />
        </div>
      )}

      <div className="w-full">
        {/* Comment panel */}
        <CommentPanel
          comments={spatialComments}
          isCreator={isCreator}
          currentVoterId={voterId}
          onDelete={handleDeleteComment}
          onHighlight={setHighlightedCommentId}
        />
        {/* ── Title row ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold leading-tight">{option.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
          </div>
          {isCreator && session.phase !== "revealed" && (
            <button
              className="text-muted-foreground hover:text-destructive transition-colors p-1"
              onClick={() => {
                if (window.confirm("Delete this option?")) {
                  removeOption(id, optionId);
                  router.push(`/explorations/${id}`);
                }
              }}
            >
              <Trash2 className="size-5" />
            </button>
          )}
        </div>
        {/* ── Body text ───────────────────────────────────────── */}
        <div className="mb-4 space-y-2">
          {option.description && (
            <p className="text-[15px] leading-relaxed">{option.description}</p>
          )}
          {option.rationale && (
            <p className="text-sm text-muted-foreground italic">
              {option.rationale}
            </p>
          )}
        </div>

        <div className="border-t my-3" />

        {/* ── Engagement row ──────────────────────────────────── */}
        <OptionVoteBar session={session} option={option} />
      </div>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
