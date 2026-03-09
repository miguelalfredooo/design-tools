"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Users, Trash2 } from "lucide-react";
import { useSessions, getCreatorToken } from "@/lib/design-store";
import { useAdmin } from "@/hooks/use-admin";
import { FeedOptionPost } from "@/components/design/feed-option-post";
import { EmptySessionState } from "@/components/design/empty-session-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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

function canManageSession(session: ExplorationSession, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  const token = getCreatorToken(session.id);
  return token !== null && token === session.creatorToken;
}

type Tab = "mine" | "all";

function DesignHomeFeed() {
  const { mySessions, allSessions, loading, loadMySessions, loadAllSessions, deleteSession } =
    useSessions();
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>("mine");

  useEffect(() => {
    loadMySessions();
    loadAllSessions();
  }, [loadMySessions, loadAllSessions]);

  const mySessionIds = new Set(mySessions.map((s) => s.id));
  const otherSessions = allSessions.filter((s) => !mySessionIds.has(s.id));

  const sessions = activeTab === "mine" ? mySessions : otherSessions;

  return (
    <div className="min-w-0">
      {loading ? (
        <p className="text-center text-muted-foreground py-12">
          Loading sessions...
        </p>
      ) : mySessions.length === 0 && allSessions.length === 0 ? (
        <EmptySessionState />
      ) : (
        <div className="w-full min-w-0 space-y-6">
          <h2 className="text-2xl font-black tracking-tight">Projects</h2>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            {([
              { id: "mine" as Tab, label: "My Sessions", count: mySessions.length },
              { id: "all" as Tab, label: "All Sessions", count: otherSessions.length },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span className={cn(
                  "text-xs tabular-nums",
                  activeTab === tab.id ? "text-foreground/60" : "text-muted-foreground/60"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {activeTab === "mine"
                ? "No sessions yet. Create one to get started."
                : "No sessions from others yet."}
            </p>
          ) : (
            <div className="space-y-10">
              {sessions.map((session, idx) => (
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
                      {canManageSession(session, isAdmin) && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deleteSession(session.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
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
              ))}
            </div>
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
