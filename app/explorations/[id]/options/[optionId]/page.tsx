"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import { useSessions } from "@/lib/design-store";
import { Button } from "@/components/ui/button";
import { OptionVoteBar } from "@/components/design/option-vote-bar";
import { OptionComments } from "@/components/design/option-comments";

export default function OptionDetailPage({
  params,
}: {
  params: Promise<{ id: string; optionId: string }>;
}) {
  const { id, optionId } = use(params);
  const { session, loading, loadSession } = useSessions();

  useEffect(() => {
    loadSession(id);
  }, [id, loadSession]);

  if (loading && !session) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12 text-center">
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
      <div className="mx-auto max-w-[720px] px-4 py-12 text-center">
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

  const initials = option.title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const createdDate = new Date(session.createdAt);
  const timeAgo = formatTimeAgo(createdDate);

  return (
    <div className="py-8 overflow-hidden">
      <div className="mx-auto max-w-[720px] px-4">
        {/* Back navigation */}
        <Link
          href={`/explorations/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-3.5" />
          {session.title}
        </Link>

        {/* ── Author row ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-full bg-[#4a4340] flex items-center justify-center text-sm font-semibold text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">{option.title}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <MoreHorizontal className="size-5" />
          </button>
        </div>
      </div>

      {/* ── Media ───────────────────────────────────────────── */}
      {option.mediaType === "image" && option.mediaUrl && (
        <div className="mx-auto max-w-[720px] px-4 mb-4">
          <div className="rounded-2xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={option.mediaUrl}
              alt={option.title}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      )}

      {option.mediaType === "figma-embed" && option.mediaUrl && (
        <div className="mb-4 mx-4 rounded-2xl overflow-hidden">
          <iframe
            src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(option.mediaUrl)}`}
            className="w-full h-[80vh] border-0"
            allowFullScreen
          />
        </div>
      )}

      {option.mediaType === "excalidraw" && option.mediaUrl && (
        <div className="mb-4 mx-4 rounded-2xl overflow-hidden">
          <iframe
            src={option.mediaUrl}
            className="w-full h-[80vh] border-0"
            allowFullScreen
          />
        </div>
      )}

      <div className="mx-auto max-w-[720px] px-4">
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

        {/* ── Comments section ────────────────────────────────── */}
        <OptionComments session={session} option={option} />
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
