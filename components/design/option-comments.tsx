"use client";

import { useEffect } from "react";
import { Heart, MessageCircle } from "lucide-react";
import type {
  ExplorationSession,
  ExplorationOption,
  DesignComment,
} from "@/lib/design-types";
import { useSessions } from "@/lib/design-store";
import { CommentInput } from "@/components/design/comment-input";

interface OptionCommentsProps {
  session: ExplorationSession;
  option: ExplorationOption;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function CommentRow({ comment }: { comment: DesignComment }) {
  return (
    <div className="flex gap-3">
      <div className="size-8 rounded-full bg-[#4a4340] flex items-center justify-center text-[11px] font-medium text-white shrink-0 mt-0.5">
        {getInitials(comment.voterName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold">{comment.voterName}</span>
          <span className="text-muted-foreground ml-2 text-xs">
            {formatTimeAgo(comment.createdAt)}
          </span>
        </p>
        <p className="text-sm leading-relaxed mt-0.5">{comment.body}</p>
        <div className="flex items-center gap-3 mt-1.5 text-muted-foreground">
          <button className="hover:text-foreground transition-colors">
            <Heart className="size-3.5" />
          </button>
          <button className="inline-flex items-center gap-1 text-xs hover:text-foreground transition-colors">
            <MessageCircle className="size-3.5" />
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export function OptionComments({ session, option }: OptionCommentsProps) {
  const { comments, loadComments } = useSessions();

  useEffect(() => {
    loadComments(session.id);
  }, [session.id, loadComments]);

  const optionComments = comments.filter((c) => c.optionId === option.id);

  return (
    <div className="pt-3 space-y-4">
      <CommentInput sessionId={session.id} optionId={option.id} />

      {optionComments.map((c) => (
        <CommentRow key={c.id} comment={c} />
      ))}
    </div>
  );
}
