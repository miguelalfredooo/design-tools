"use client";

import { Suspense, useEffect, useState } from "react";
import { useSessions, getCreatorToken } from "@/lib/design-store";
import { useAdmin } from "@/hooks/use-admin";
import { EmptySessionState } from "@/components/design/empty-session-state";
import { SessionCard } from "@/components/design/session-card";
import { cn } from "@/lib/utils";
import type { ExplorationSession } from "@/lib/design-types";

function canManageSession(session: ExplorationSession, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  const token = getCreatorToken(session.id);
  return token !== null && token === session.creatorToken;
}

type Tab = "mine" | "all";

function DesignHomeFeed() {
  const { mySessions, allSessions, loading, loadMySessions, loadAllSessions } =
    useSessions();
  const { isAdmin } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>("mine");

  useEffect(() => {
    loadMySessions();
    loadAllSessions();
  }, [loadMySessions, loadAllSessions]);

  const mySessionIds = new Set(mySessions.map((s) => s.id));
  const otherSessions = allSessions.filter((s) => !mySessionIds.has(s.id));
  const resolvedActiveTab: Tab =
    activeTab === "mine" && mySessions.length === 0 && otherSessions.length > 0
      ? "all"
      : activeTab;
  const sessions = resolvedActiveTab === "mine" ? mySessions : otherSessions;

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
          <h2 className="text-2xl font-black tracking-tight">Sessions</h2>

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
                  resolvedActiveTab === tab.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span className={cn(
                  "text-xs tabular-nums",
                  resolvedActiveTab === tab.id ? "text-foreground/60" : "text-muted-foreground/60"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {sessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              {resolvedActiveTab === "mine"
                ? "No sessions yet. Create one to get started."
                : "No sessions from others yet."}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  scope={resolvedActiveTab}
                  canManage={canManageSession(session, isAdmin)}
                />
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
