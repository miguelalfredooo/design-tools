"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { SynthesizeButton } from "@/components/design/synthesize-button";
import { SessionInsights } from "@/components/design/session-insights";
import { Button } from "@/components/ui/button";
import type { ExplorationSession } from "@/lib/design-types";
import type { ResearchInsight } from "@/lib/research-types";

function PromoteButton({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [alreadyPromoted, setAlreadyPromoted] = useState(false);
  const [promotedCount, setPromotedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch(`/api/design/sessions/${sessionId}/promote-observations`)
      .then((r) => r.json())
      .then((d) => {
        if (d.promoted) {
          setAlreadyPromoted(true);
          setPromotedCount(d.count);
        }
      })
      .catch(() => {});
  }, [sessionId]);

  async function handlePromote() {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/design/sessions/${sessionId}/promote-observations`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Failed to promote observations.");
        return;
      }
      setStatus("done");
      setAlreadyPromoted(true);
      setPromotedCount(data.promoted);
    } catch {
      setStatus("error");
      setErrorMsg("Could not reach the server.");
    }
  }

  if (alreadyPromoted) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Check className="size-3.5 text-green-500" />
        {promotedCount} observation{promotedCount !== 1 ? "s" : ""} in Research Hub
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        size="sm"
        variant="outline"
        onClick={handlePromote}
        disabled={status === "loading" || status === "done"}
        className="gap-1.5"
      >
        {status === "loading" ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ArrowUpRight className="size-3.5" />
        )}
        {status === "loading" ? "Sending..." : "Send to Research Hub"}
      </Button>
      {status === "error" && (
        <p className="text-xs text-destructive">{errorMsg}</p>
      )}
    </div>
  );
}

export function SessionResearchTabContent({
  session,
  isCreator,
  insights,
  onReloadInsights,
}: {
  session: ExplorationSession;
  isCreator: boolean;
  insights: ResearchInsight[];
  onReloadInsights: () => Promise<void>;
}) {
  if (session.phase !== "revealed") {
    return (
      <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        Research becomes available after voting is complete and the session reaches the results phase.
      </div>
    );
  }

  if (insights.length > 0) {
    return (
      <div className="space-y-6">
        <SessionInsights insights={insights} />
        {isCreator && (
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Promote vote comments and synthesis themes as observations
            </p>
            <PromoteButton sessionId={session.id} />
          </div>
        )}
      </div>
    );
  }

  if (isCreator) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-dashed bg-muted/30 px-4 py-4">
        <p className="text-sm text-muted-foreground">
          Synthesize voter feedback into actionable insights
        </p>
        <SynthesizeButton
          endpoint={`/api/design/sessions/${session.id}/synthesize`}
          variant="outline"
          icon="flask"
          onComplete={onReloadInsights}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
      Research synthesis will appear here once the session owner generates insights.
    </div>
  );
}
