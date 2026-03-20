"use client";

import { useState, useEffect } from "react";
import { Brain, ChevronDown } from "lucide-react";
import { DesignOpsCrewRunner } from "@/components/design/design-ops-crew-runner";
import { DesignOpsTimeline } from "@/components/design/design-ops-timeline";
import { useAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";
import { CarrierInput } from "@/components/ui/carrier-input";
import { CarrierTextarea } from "@/components/ui/carrier-textarea";
import type { Objective, AgentMessage } from "@/lib/design-ops-types";

export function DesignOpsClient() {
  const { isAdmin } = useAdmin();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBrief, setShowBrief] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [problem, setProblem] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [constraints, setConstraints] = useState("");

  useEffect(() => {
    fetch("/api/design-ops/objectives")
      .then((r) => r.json())
      .then((data) => {
        setObjectives(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <Brain className="size-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Design Ops</h2>
        <p className="text-muted-foreground text-sm">
          Admin access required. Click the lock icon in the sidebar to unlock.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading Design Ops...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Design Ops</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered research synthesis tied to your business objectives.
        </p>
      </div>

      {/* Setup Form - Carrier /new aesthetic */}
      <div className="space-y-6">
        {/* Title & Description */}
        <div className="space-y-3">
          <CarrierInput
            placeholder="Session title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            designSize="lg"
            className="font-bold tracking-tight"
          />
          <CarrierTextarea
            placeholder="Brief description for voters..."
            rows={1}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-muted-foreground"
          />
        </div>

        {/* Context Brief */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowBrief(!showBrief)}
            className="flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors"
          >
            Context Brief
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                showBrief ? "rotate-180" : ""
              )}
            />
          </button>

          {showBrief && (
            <div className="space-y-6">
              {/* Problem / Goal */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <div className="text-sm font-semibold text-foreground">Problem</div>
                  <CarrierTextarea
                    placeholder="What problem does this solve?"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    designSize="sm"
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="text-sm font-semibold text-foreground">Goal</div>
                  <CarrierTextarea
                    placeholder="What's the desired outcome?"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    designSize="sm"
                    rows={3}
                  />
                </div>
              </div>

              {/* Audience / Constraints */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <div className="text-sm font-semibold text-foreground">Audience</div>
                  <CarrierTextarea
                    placeholder="Who is this for?"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    designSize="sm"
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="text-sm font-semibold text-foreground">Constraints</div>
                  <CarrierTextarea
                    placeholder="Any limitations?"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
                    designSize="sm"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview URL */}
        <div className="space-y-1.5">
          <CarrierInput
            type="url"
            placeholder="Preview URL (optional) — https://..."
            value={previewUrl}
            onChange={(e) => setPreviewUrl(e.target.value)}
            designSize="sm"
            className="text-muted-foreground"
          />
        </div>
      </div>

      {/* Crew Runner + Timeline */}
      <div className="space-y-6">
        <DesignOpsCrewRunner
          objectives={objectives}
          onMessages={setMessages}
          onRunStatusChange={setRunning}
        />

        {(messages.length > 0 || running) && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {running ? "Crew Activity" : "Results"}
            </h3>
            <DesignOpsTimeline messages={messages} />
          </div>
        )}
      </div>
    </div>
  );
}
