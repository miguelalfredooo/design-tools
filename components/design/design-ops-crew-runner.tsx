"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Play, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CarrierTextarea } from "@/components/ui/carrier-textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { Objective, AgentMessage, CrewHealthStatus, DesignOutput } from "@/lib/design-ops-types";

interface DesignOpsCrewRunnerProps {
  objectives: Objective[];
  onMessages: (messages: AgentMessage[]) => void;
  onRunStatusChange: (running: boolean) => void;
  iteration?: number;
  previousDesignOutput?: DesignOutput | null;
  onIterationComplete?: () => void;
  problemStatement?: string;
  userSegment?: string;
  metric?: string;
  constraints?: string;
}

export function DesignOpsCrewRunner({
  objectives,
  onMessages,
  onRunStatusChange,
  iteration = 1,
  previousDesignOutput,
  onIterationComplete,
  problemStatement = "",
  userSegment = "",
  metric = "",
  constraints = "",
}: DesignOpsCrewRunnerProps) {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [synthesisT, setSynthesisTier] = useState<"quick" | "balanced" | "in-depth">("balanced");
  const [health, setHealth] = useState<CrewHealthStatus | null>(null);

  // Health check on mount
  useEffect(() => {
    fetch("/api/design-ops/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() =>
        setHealth({ status: "unavailable", ollama: "unknown", models: [], configuredModel: "unknown" })
      );
  }, []);

  const handleRun = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Enter a focus prompt for Oracle");
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
          synthesis_tier: synthesisT,
          problem_statement: problemStatement || prompt.trim(),
          user_segment: userSegment,
          metric: metric,
          constraints: constraints ? [constraints] : [],
          previous_design_output: previousDesignOutput || null,
          iteration: iteration,
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

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              // Check if this is an agent_message event
              if (data.from && data.body) {
                const msg: AgentMessage = {
                  from: data.from,
                  fromName: data.from_name || data.fromName || "",
                  to: data.to || "",
                  subject: data.subject || "",
                  priority: data.priority || "standard",
                  confidence: data.confidence || "medium",
                  assumptions: data.assumptions || "",
                  body: data.body || "",
                  nextStep: data.next_step || data.nextStep || "",
                  timestamp: data.timestamp || new Date().toISOString(),
                  tier: synthesisT, // Pass the selected synthesis tier to each message
                };
                messages.push(msg);
                onMessages([...messages]);
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }

      toast.success("Crew synthesis complete");
      onIterationComplete?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Crew run failed";
      toast.error(message);
    } finally {
      setRunning(false);
      onRunStatusChange(false);
    }
  }, [prompt, synthesisT, onMessages, onRunStatusChange, iteration, previousDesignOutput, onIterationComplete]);

  const crewUnavailable = health?.status === "unavailable";
  const ollamaUnavailable = health?.ollama === "unavailable";

  return (
    <div className="space-y-4">
      {/* Health warnings */}
      {crewUnavailable && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          <AlertTriangle className="size-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400">
            Crew service unavailable. Start it with: <code className="bg-muted px-1 rounded">cd crew && source venv/bin/activate && uvicorn main:app --port 8000</code>
          </p>
        </div>
      )}

      {!crewUnavailable && ollamaUnavailable && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
          <AlertTriangle className="size-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-400">
            Ollama not running. Start Ollama to use Design Ops.
          </p>
        </div>
      )}

      {/* Synthesis Tier */}
      <div className="mb-4 space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Synthesis Tier
        </Label>
        <RadioGroup value={synthesisT} onValueChange={(val) => setSynthesisTier(val as "quick" | "balanced" | "in-depth")}>
          <div className="flex gap-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="quick" id="tier-quick" />
              <Label htmlFor="tier-quick" className="font-normal cursor-pointer">
                ⚡ Quick
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="balanced" id="tier-balanced" />
              <Label htmlFor="tier-balanced" className="font-normal cursor-pointer">
                ⚙️ Balanced
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="in-depth" id="tier-indepth" />
              <Label htmlFor="tier-indepth" className="font-normal cursor-pointer">
                🔬 In-Depth
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Prompt input */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Focus prompt</label>
        <CarrierTextarea
          placeholder="What should Oracle focus on? (e.g., Why are users dropping off during onboarding?)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          disabled={running}
          designSize="sm"
        />
      </div>

      {/* Run button */}
      <Button
        onClick={handleRun}
        disabled={running || crewUnavailable || !prompt.trim()}
        className="w-full"
      >
        {running ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" />
            Crew is thinking...
          </>
        ) : (
          <>
            <Play className="size-4 mr-2" />
            Run Crew
          </>
        )}
      </Button>

      {/* Iterate button */}
      {previousDesignOutput && !running && (
        <Button
          onClick={handleRun}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="size-4 mr-2" />
          Iterate (Round {iteration})
        </Button>
      )}
    </div>
  );
}
