"use client";

import { useEffect, useState } from "react";
import { BarChart2, ChevronDown, Lightbulb, Loader2, OctagonAlert, RefreshCw, Sparkles, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { directions as staticDirections } from "@/lib/directions-data";
import type { DesignDirection } from "@/lib/directions-data";
import { useVoterIdentity } from "@/hooks/use-voter-identity";

type GenerateStatus = "idle" | "generating" | "done" | "error";

interface DirectionVote {
  id: string;
  direction_id: string;
  voter_name: string;
  reason: string | null;
}

export function DirectionsTab() {
  const [directions, setDirections] = useState<DesignDirection[]>([]);
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [isGenerated, setIsGenerated] = useState(false);

  const [votes, setVotes] = useState<DirectionVote[]>([]);
  const [votingId, setVotingId] = useState<string | null>(null);
  // Track which cards have the reason field expanded
  const [reasonOpen, setReasonOpen] = useState<Record<string, boolean>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const { name: voterName } = useVoterIdentity();

  // Load saved directions on mount
  useEffect(() => {
    fetch("/api/design/research/directions")
      .then((r) => r.json())
      .then((data: DesignDirection[]) => {
        if (data.length > 0) {
          setDirections(data);
          setIsGenerated(true);
        } else {
          setDirections(staticDirections);
        }
      })
      .catch(() => setDirections(staticDirections));
  }, []);

  // Load votes on mount
  useEffect(() => {
    fetch("/api/design/research/directions/votes")
      .then((r) => r.json())
      .then((data: DirectionVote[]) => {
        if (Array.isArray(data)) setVotes(data);
      })
      .catch(() => {});
  }, []);

  async function handleGenerate() {
    setStatus("generating");
    setStatusMsg("Gathering research context...");
    setDirections([]);

    try {
      const res = await fetch("/api/design/research/directions/generate", {
        method: "POST",
      });

      if (!res.ok || !res.body) {
        setStatus("error");
        setStatusMsg("Crew service unavailable. Make sure the server is running on port 8000.");
        setDirections(staticDirections);
        return;
      }

      setStatusMsg("Design Directions agent is thinking...");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let eventType = "";
      const incoming: DesignDirection[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            try {
              const payload = JSON.parse(line.slice(5).trim());
              if (eventType === "direction" && payload.title) {
                incoming.push(payload as DesignDirection);
                setDirections([...incoming]);
              } else if (eventType === "run_complete") {
                setStatus("done");
                setIsGenerated(true);
                setStatusMsg("");
              } else if (eventType === "error") {
                setStatus("error");
                setStatusMsg(payload.error || "Generation failed.");
                if (incoming.length === 0) setDirections(staticDirections);
              }
            } catch { /* ignore */ }
          }
        }
      }

      if (status !== "error") {
        setStatus("done");
        setIsGenerated(true);
      }
    } catch {
      setStatus("error");
      setStatusMsg("Could not reach the crew service.");
      if (directions.length === 0) setDirections(staticDirections);
    }
  }

  async function handleVote(directionId: string) {
    if (!voterName || votingId === directionId) return;

    setVotingId(directionId);
    const reason = reasons[directionId] || "";

    try {
      const res = await fetch("/api/design/research/directions/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction_id: directionId, voter_name: voterName, reason }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.voted) {
          // Add vote to local state
          setVotes((prev) => [
            ...prev,
            { id: crypto.randomUUID(), direction_id: directionId, voter_name: voterName, reason: reason || null },
          ]);
        } else {
          // Remove vote from local state
          setVotes((prev) =>
            prev.filter((v) => !(v.direction_id === directionId && v.voter_name === voterName))
          );
          setReasonOpen((prev) => ({ ...prev, [directionId]: false }));
        }
      }
    } finally {
      setVotingId(null);
    }
  }

  const isGenerating = status === "generating";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground max-w-lg">
          {isGenerated
            ? "Generated from your research observations, segment insights, objectives, and Design Ops modules."
            : "Design ideas worth exploring, grounded in the research synthesis. Generate a fresh set from live data at any time."}
        </p>
        <Button
          size="sm"
          variant={isGenerated ? "outline" : "default"}
          onClick={handleGenerate}
          disabled={isGenerating}
          className="shrink-0 gap-1.5"
        >
          {isGenerating ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : isGenerated ? (
            <RefreshCw className="size-3.5" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {isGenerating ? "Generating..." : isGenerated ? "Regenerate" : "Generate from research"}
        </Button>
      </div>

      {/* Status message while generating */}
      {isGenerating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin shrink-0" />
          {statusMsg}
        </div>
      )}

      {/* Error */}
      {status === "error" && statusMsg && (
        <p className="text-sm text-destructive">{statusMsg}</p>
      )}

      {/* Direction cards */}
      <div className="space-y-4">
        {directions.map((d, i) => {
          const dirId = d.id ?? String(i);
          const cardVotes = votes.filter((v) => v.direction_id === dirId);
          const myVote = voterName ? cardVotes.find((v) => v.voter_name === voterName) : undefined;
          const isVoting = votingId === dirId;
          const showReason = reasonOpen[dirId] ?? false;

          return (
            <Card key={dirId} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header row */}
                <div className="px-5 pt-5 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold leading-snug">{d.title}</h3>
                    {d.moduleRef && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0 shrink-0 whitespace-nowrap text-muted-foreground"
                      >
                        {d.moduleRef}
                      </Badge>
                    )}
                  </div>
                  {d.source && (
                    <p className="text-[11px] text-muted-foreground/60 italic">{d.source}</p>
                  )}
                </div>

                <div className="h-px bg-border mx-5" />

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">Problem</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{d.problem}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-foreground">The idea</p>
                    <p className="text-sm leading-relaxed">{d.idea}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-muted/50 px-3.5 py-3 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Lightbulb className="size-3 text-amber-500 shrink-0" />
                        <p className="text-xs font-semibold text-foreground">Why it works</p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{d.why}</p>
                    </div>

                    <div className="rounded-lg bg-red-50 px-3.5 py-3 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <OctagonAlert className="size-3 text-red-400 shrink-0" />
                        <p className="text-xs font-semibold text-red-500">Watch out</p>
                      </div>
                      <p className="text-xs text-red-700/80 leading-relaxed">{d.risk}</p>
                    </div>
                  </div>

                  {d.metric && (
                    <div className="flex items-center gap-2 pt-1">
                      <BarChart2 className="size-3 text-muted-foreground/60 shrink-0" />
                      <p className="text-xs text-muted-foreground/70">{d.metric}</p>
                    </div>
                  )}

                  {/* Vote row */}
                  <div className="border-t border-border pt-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (!myVote && !showReason) {
                            setReasonOpen((prev) => ({ ...prev, [dirId]: true }));
                          } else {
                            handleVote(dirId);
                          }
                        }}
                        disabled={isVoting || !voterName}
                        title={!voterName ? "Set your name to vote" : undefined}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
                          myVote
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        }`}
                      >
                        {isVoting ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <ThumbsUp className="size-3" />
                        )}
                        {cardVotes.length > 0 ? cardVotes.length : "Vote"}
                      </button>

                      {/* Add/edit reason toggle — only when not yet voted */}
                      {!myVote && voterName && (
                        <button
                          onClick={() =>
                            setReasonOpen((prev) => ({ ...prev, [dirId]: !prev[dirId] }))
                          }
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Add reason
                          <ChevronDown
                            className={`size-3 transition-transform ${showReason ? "rotate-180" : ""}`}
                          />
                        </button>
                      )}

                      {/* Voter names */}
                      {cardVotes.length > 0 && (
                        <p className="text-xs text-muted-foreground/60 truncate">
                          {cardVotes.map((v) => v.voter_name).join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Reason input — shown when adding a vote or editing reason */}
                    {showReason && !myVote && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Why do you support this direction? (optional)"
                          value={reasons[dirId] ?? ""}
                          onChange={(e) =>
                            setReasons((prev) => ({ ...prev, [dirId]: e.target.value }))
                          }
                          rows={2}
                          className="text-xs resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleVote(dirId)}
                            disabled={isVoting}
                          >
                            {isVoting ? <Loader2 className="size-3 animate-spin" /> : null}
                            Vote
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => {
                              setReasonOpen((prev) => ({ ...prev, [dirId]: false }));
                              setReasons((prev) => ({ ...prev, [dirId]: "" }));
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Show existing vote reasons */}
                    {cardVotes.some((v) => v.reason) && (
                      <div className="space-y-1">
                        {cardVotes
                          .filter((v) => v.reason)
                          .map((v) => (
                            <div key={v.id} className="flex gap-2 text-xs text-muted-foreground">
                              <span className="font-medium shrink-0">{v.voter_name}:</span>
                              <span className="leading-relaxed">{v.reason}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
