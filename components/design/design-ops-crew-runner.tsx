"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Loader2, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMetricLabel } from "@/lib/design-ops-label-helpers";
import { toPlainText } from "@/lib/design-ops-formatting";
import {
  buildRecommendedPrompt,
} from "@/lib/design-ops-prompts";
import { toast } from "sonner";
import type {
  Objective,
  AgentMessage,
  CrewHealthStatus,
  SynthesisMode,
} from "@/lib/design-ops-types";

interface DesignOpsCrewRunnerProps {
  objective: Objective | null;
  onMessages: (messages: AgentMessage[]) => void;
  onRunStatusChange: (running: boolean) => void;
  onModeChange?: (mode: SynthesisMode) => void;
  onRunComplete?: (payload: {
    prompt: string;
    mode: SynthesisMode;
    objectives: Objective[];
    messages: AgentMessage[];
    provider?: string;
    model?: string;
  }) => void | Promise<void>;
}

const SYNTHESIS_MODES: Array<{
  value: SynthesisMode;
  shortLabel: string;
  description: string;
}> = [
  {
    value: "quick_read",
    shortLabel: "Quick",
    description: "Fast signal: recommendation, confidence, assumptions, next step.",
  },
  {
    value: "decision_memo",
    shortLabel: "Balanced",
    description: "Balanced depth: recommendation, rationale, alternatives, and risks.",
  },
  {
    value: "deep_dive",
    shortLabel: "Deep",
    description: "Full analysis: scenarios, evidence gaps, and richer tradeoffs.",
  },
];

export function DesignOpsCrewRunner({
  objective,
  onMessages,
  onRunStatusChange,
  onModeChange,
  onRunComplete,
}: DesignOpsCrewRunnerProps) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<SynthesisMode>("decision_memo");
  const [running, setRunning] = useState(false);
  const [health, setHealth] = useState<CrewHealthStatus | null>(null);
  const lastSuggestedPrompt = useRef("");
  const recommendedPrompt = useMemo(() => buildRecommendedPrompt(objective), [objective]);

  useEffect(() => {
    if (!recommendedPrompt) return;
    if (!prompt.trim() || prompt === lastSuggestedPrompt.current) {
      setPrompt(recommendedPrompt);
      lastSuggestedPrompt.current = recommendedPrompt;
    }
  }, [recommendedPrompt, prompt]);

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  // Health check on mount
  useEffect(() => {
    fetch("/api/design-ops/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  const consumeEventChunk = useCallback(
    (
      eventChunk: string,
      context: {
        promptText: string;
        messages: AgentMessage[];
        onEmit: (nextMessages: AgentMessage[]) => void;
        setStreamError: (message: string) => void;
      }
    ) => {
      let currentEvent = "";
      const lines = eventChunk
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .filter(Boolean);

      for (const line of lines) {
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
          continue;
        }

        if (!line.startsWith("data:")) continue;

        try {
          const data = JSON.parse(line.slice(5).trim());
          if (currentEvent === "run_start") {
            const msg: AgentMessage = {
              from: "system",
              fromName: "SYSTEM",
              to: "user",
              subject: "Crew run started",
              priority: "standard",
              confidence: "n/a",
              assumptions: "The request was accepted and the crew orchestration has started.",
              body: `Run started for prompt: ${data.prompt || context.promptText}`,
              nextStep: "Design Strategy is framing the brief.",
              timestamp: data.started_at || new Date().toISOString(),
            };
            context.messages.push(msg);
            context.onEmit([...context.messages]);
            continue;
          }

          if (currentEvent === "agent_start") {
            const agentName =
              data.agent === "design_strategy" || data.agent === "ORACLE"
                ? "Design Strategy"
                : data.agent === "research_insights" || data.agent === "MERIDIAN"
                  ? "Research & Insights"
                  : data.agent || "Agent";
            const msg: AgentMessage = {
              from: data.agent_id || "system",
              fromName: agentName,
              to: "user",
              subject: `${agentName} is working`,
              priority: "standard",
              confidence: "n/a",
              assumptions: "This is a progress signal, not a synthesis result.",
              body: `${agentName} is currently ${data.status || "working"} on the request.`,
              nextStep: "Wait for the next streamed update.",
              timestamp: new Date().toISOString(),
            };
            context.messages.push(msg);
            context.onEmit([...context.messages]);
            continue;
          }

          if (currentEvent === "error") {
            context.setStreamError(data.error || "Crew run failed");
            continue;
          }

          if (currentEvent === "agent_message" && data.from && data.body) {
            const msg: AgentMessage = {
              from: data.from,
              fromName: data.from_name || data.fromName || "",
              to: data.to || "",
              subject: toPlainText(data.subject || ""),
              priority: data.priority || "standard",
              confidence: data.confidence || "medium",
              assumptions: toPlainText(data.assumptions || ""),
              body: toPlainText(data.body || ""),
              nextStep: toPlainText(data.next_step || data.nextStep || ""),
              timestamp: data.timestamp || new Date().toISOString(),
            };
            context.messages.push(msg);
            context.onEmit([...context.messages]);
          }
        } catch {
          // Skip non-JSON lines
        }
      }
    },
    []
  );

  const handleRun = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Add a question to continue");
      return;
    }
    if (!objective) {
      toast.error("Create or load an objective first");
      return;
    }

    setRunning(true);
    onRunStatusChange(true);
    onMessages([]);

    try {
      const res = await fetch("/api/design-ops/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode,
          objectives: [objective],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Crew run failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      const messages: AgentMessage[] = [];
      let buffer = "";
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split(/\r?\n\r?\n/);
        buffer = events.pop() || "";

        for (const eventChunk of events) {
          consumeEventChunk(eventChunk, {
            promptText: prompt.trim(),
            messages,
            onEmit: onMessages,
            setStreamError: (message) => {
              streamError = message;
            },
          });
        }
      }

      if (buffer.trim()) {
        consumeEventChunk(buffer, {
          promptText: prompt.trim(),
          messages,
          onEmit: onMessages,
          setStreamError: (message) => {
            streamError = message;
          },
        });
      }

      if (streamError) {
        throw new Error(streamError);
      }

      await onRunComplete?.({
        prompt: prompt.trim(),
        mode,
        objectives: [objective],
        messages: [...messages],
        provider: health?.provider,
        model: health?.configuredModel,
      });
      toast.success("Crew synthesis complete");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Crew run failed";
      toast.error(message);
    } finally {
      setRunning(false);
      onRunStatusChange(false);
    }
  }, [
    consumeEventChunk,
    prompt,
    mode,
    objective,
    onMessages,
    onRunStatusChange,
    onRunComplete,
    health?.provider,
    health?.configuredModel,
  ]);

  const providerUnavailable =
    health?.status === "ok" &&
    ["unavailable", "missing_api_key", "error"].includes(
      health?.providerStatus || ""
    );
  const providerName = health?.provider === "openai" ? "OpenAI" : "model provider";

  return (
    <div className="space-y-4">
      {/* Health warnings */}
      {providerUnavailable && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          <AlertTriangle className="size-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400">
            {providerName} is not configured. Update your Crew env to use Design Ops.
          </p>
        </div>
      )}

      {/* Mode selector */}
      <span className="do-section-label">1. Synthesis Depth</span>
      <div className="flex gap-1 rounded-lg border border-border/60 bg-muted/30 p-1 w-fit">
        {SYNTHESIS_MODES.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            disabled={running}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === option.value
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.shortLabel}
          </button>
        ))}
      </div>
      <p className="do-mode-desc">
        {SYNTHESIS_MODES.find(m => m.value === mode)?.description ?? ""}
      </p>

      <div className="space-y-1.5 mt-5">
        <span className="do-section-label">2. Focus Question</span>
        <Label htmlFor="crew-runner-prompt" className="text-sm font-semibold sr-only">
          What do you want to understand?
        </Label>
        <Textarea
          id="crew-runner-prompt"
          placeholder="e.g., Why are users dropping off during onboarding?"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          disabled={running}
          className="do-textarea"
        />
      </div>

      {objective && (
        <div className="mt-5">
          <span className="do-section-label">3. Active Objective</span>
          <div className="do-table-wrap">
            <table className="do-table">
              <thead>
                <tr>
                  <th>Objective</th>
                  <th>Metric</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>{objective.title}</strong></td>
                  <td>
                    <span className="do-badge do-badge-gray">
                      {getMetricLabel(objective.metric)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Run button */}
      <Button onClick={handleRun} disabled={running || !prompt.trim() || !objective} className="w-full h-11 mt-4 text-[15px]">
        {running ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Analysis in progress...
          </>
        ) : (
          <>
            <Play className="size-4 mr-2" />
            Run analysis
          </>
        )}
      </Button>
    </div>
  );
}
