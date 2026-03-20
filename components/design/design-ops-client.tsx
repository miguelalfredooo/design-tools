"use client";

import { useState, useEffect } from "react";
import { Brain, ChevronDown, HelpCircle } from "lucide-react";
import { DesignOpsCrewRunner } from "@/components/design/design-ops-crew-runner";
import { DesignOpsTimeline } from "@/components/design/design-ops-timeline";
import { useAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";
import { CarrierInput } from "@/components/ui/carrier-input";
import { CarrierTextarea } from "@/components/ui/carrier-textarea";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Objective, AgentMessage, DesignOutput } from "@/lib/design-ops-types";

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
  const [metric, setMetric] = useState("");
  const [constraints, setConstraints] = useState("");
  const [iteration, setIteration] = useState(1);
  const [lastDesignOutput, setLastDesignOutput] = useState<DesignOutput | null>(null);

  useEffect(() => {
    fetch("/api/design-ops/objectives")
      .then((r) => r.json())
      .then((data) => {
        setObjectives(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Extract designer output whenever messages update
  useEffect(() => {
    const designerMsg = [...messages].reverse().find(m => m.from === "product_designer");
    if (designerMsg?.body) {
      try {
        setLastDesignOutput(JSON.parse(designerMsg.body));
      } catch {
        // Ignore parse errors
      }
    }
  }, [messages]);

  const populateSampleData = () => {
    setTitle("Raptive Creator Engagement");
    setDescription("Testing the iteration loop with creator engagement problem space");
    setProblem("Creators are underengaged — no visibility into what's working, no tools to maintain presence efficiently.");
    setGoal("Increase consistent posting frequency, boost engagement metrics, and grow pageviews among our creator community.");
    setAudience("Mid-tier content creators (10k-100k followers) on Raptive Community Platform who rely on consistent presence");
    setMetric("Posting frequency (posts/week), engagement rate (comments + shares), pageview growth month-over-month");
    setConstraints("Must integrate with existing Raptive dashboard, no external tool dependencies, launch within Q2.");
  };

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
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Design Ops</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered research synthesis tied to your business objectives.
          </p>
        </div>
        <button
          onClick={populateSampleData}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
        >
          Populate sample
        </button>
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
          <Textarea
            placeholder="Brief description for voters..."
            rows={3}
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">Problem</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle className="size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">A strong problem has:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li><span className="font-semibold">Who:</span> specific user type</li>
                            <li><span className="font-semibold">What:</span> concrete pain point</li>
                            <li><span className="font-semibold">Why:</span> impact or friction</li>
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea
                    placeholder="What problem does this solve?"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">Goal</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle className="size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">Goal should define:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li><span className="font-semibold">Outcome:</span> what changes</li>
                            <li><span className="font-semibold">Scope:</span> for whom, where</li>
                            <li><span className="font-semibold">Timeframe:</span> by when</li>
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea
                    placeholder="What's the desired outcome?"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Audience / Metric / Constraints */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">Audience</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <HelpCircle className="size-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1 text-xs">
                            <p className="font-semibold">Audience should include:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              <li><span className="font-semibold">Segment:</span> user type, size</li>
                              <li><span className="font-semibold">Context:</span> behavior, platform</li>
                              <li><span className="font-semibold">Characteristics:</span> needs, pain</li>
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Textarea
                      placeholder="Who is this for?"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">Metric</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <HelpCircle className="size-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1 text-xs">
                            <p className="font-semibold">Metrics should be:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              <li><span className="font-semibold">Measurable:</span> quantifiable</li>
                              <li><span className="font-semibold">Behavioral:</span> user actions</li>
                              <li><span className="font-semibold">Baseline:</span> current state</li>
                            </ul>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Textarea
                      placeholder="How do we measure success?"
                      value={metric}
                      onChange={(e) => setMetric(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">Constraints</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors">
                          <HelpCircle className="size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold">Constraints are non-negotiables:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            <li><span className="font-semibold">Timeline:</span> launch date</li>
                            <li><span className="font-semibold">Technical:</span> platform limits</li>
                            <li><span className="font-semibold">Resource:</span> budget, team</li>
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Textarea
                    placeholder="Any limitations?"
                    value={constraints}
                    onChange={(e) => setConstraints(e.target.value)}
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
          iteration={iteration}
          previousDesignOutput={lastDesignOutput}
          onIterationComplete={() => setIteration(prev => prev + 1)}
          problemStatement={problem}
          userSegment={audience}
          metric={metric}
          constraints={constraints}
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
