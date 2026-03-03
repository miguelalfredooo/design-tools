"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Layers, Users } from "lucide-react";
import { useSessions } from "@/lib/design-store";
import { FeedOptionPost } from "@/components/design/feed-option-post";
import { EmptySessionState } from "@/components/design/empty-session-state";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ExplorationSession } from "@/lib/design-types";

const phaseLabel: Record<ExplorationSession["phase"], string> = {
  setup: "Setup",
  voting: "Voting",
  revealed: "Results",
};

function getWinningOptions(session: ExplorationSession) {
  const counts = new Map<string, number>();
  for (const vote of session.votes) {
    counts.set(vote.optionId, (counts.get(vote.optionId) ?? 0) + 1);
  }
  const maxVotes = Math.max(0, ...counts.values());
  if (maxVotes === 0) return session.options;
  return session.options.filter((o) => counts.get(o.id) === maxVotes);
}

function DesignHomeFeed() {
  const { mySessions, allSessions, loading, loadMySessions, loadAllSessions, loadComments } =
    useSessions();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as "home" | "mine" | "all") || "home";

  useEffect(() => {
    loadMySessions();
    loadAllSessions();
  }, [loadMySessions, loadAllSessions]);

  const mySessionIds = new Set(mySessions.map((s) => s.id));
  const otherSessions = allSessions.filter((s) => !mySessionIds.has(s.id));

  const sessions =
    activeTab === "mine"
      ? mySessions
      : activeTab === "all"
        ? otherSessions
        : allSessions;

  useEffect(() => {
    sessions.forEach((s) => loadComments(s.id));
  }, [sessions, loadComments]);

  return (
    <div className="flex justify-center min-w-0 pt-6 pb-12">
      {loading ? (
        <p className="text-center text-muted-foreground py-12">
          Loading sessions...
        </p>
      ) : mySessions.length === 0 && allSessions.length === 0 ? (
        <EmptySessionState />
      ) : (
        <div className="w-full max-w-[600px] min-w-0 space-y-10">
          <h2 className="text-2xl font-black tracking-tight">
            {activeTab === "mine" ? "My Sessions" : activeTab === "all" ? "All Sessions" : "Home"}
          </h2>
          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {activeTab === "mine"
                ? "No sessions yet. Create one to get started."
                : activeTab === "all"
                  ? "No sessions from others yet."
                  : "No sessions yet. Create one to get started."}
            </p>
          ) : (
            sessions.map((session, idx) => (
              <div key={session.id}>
                {idx > 0 && <Separator className="mb-10" />}

                <div className="mb-6 flex items-baseline justify-between gap-4">
                  <Link
                    href={`/explorations/${session.id}`}
                    className="group min-w-0"
                  >
                    <h2 className="text-lg font-semibold group-hover:underline truncate">
                      {session.title}
                    </h2>
                  </Link>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground shrink-0">
                    <Badge variant="secondary">
                      {phaseLabel[session.phase]}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Layers className="size-3.5" />
                      {session.options.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {session.voteCount}/{session.participantCount}
                    </span>
                  </div>
                </div>

                <div className="space-y-8">
                  {(session.phase === "revealed"
                    ? getWinningOptions(session)
                    : session.options
                  ).map((option) => (
                    <FeedOptionPost
                      key={option.id}
                      option={option}
                      sessionId={session.id}
                      phase={session.phase}
                      isWinner={session.phase === "revealed"}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function DesignHomePage() {
  return (
    <Suspense>
      <DesignHomeFeed />
    </Suspense>
  );
}
