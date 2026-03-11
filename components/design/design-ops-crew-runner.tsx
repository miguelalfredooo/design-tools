"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Objective, AgentMessage, CrewHealthStatus } from "@/lib/design-ops-types";

interface DesignOpsCrewRunnerProps {
  objectives: Objective[];
  onMessages: (messages: AgentMessage[]) => void;
  onRunStatusChange: (running: boolean) => void;
}

export function DesignOpsCrewRunner({
  objectives,
  onMessages,
  onRunStatusChange,
}: DesignOpsCrewRunnerProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<Set<string>>(
    new Set(objectives.map((o) => o.id))
  );
  const [running, setRunning] = useState(false);
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

  // Sync selected objectives when new ones are added
  useEffect(() => {
    setSelectedObjectiveIds(new Set(objectives.map((o) => o.id)));
  }, [objectives]);

  const toggleObjective = (id: string) => {
    setSelectedObjectiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRun = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Enter a focus prompt for Oracle");
      return;
    }

    const selected = objectives.filter((o) => selectedObjectiveIds.has(o.id));

    setRunning(true);
    onRunStatusChange(true);
    onMessages([]);

    try {
      const res = await fetch("/api/design-ops/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), objectives: selected }),
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Crew run failed";
      toast.error(message);
    } finally {
      setRunning(false);
      onRunStatusChange(false);
    }
  }, [prompt, objectives, selectedObjectiveIds, onMessages, onRunStatusChange]);

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

      {/* Prompt input */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Focus prompt</label>
        <Textarea
          placeholder="What should Oracle focus on? (e.g., Why are users dropping off during onboarding?)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          disabled={running}
        />
      </div>

      {/* Objective selection */}
      {objectives.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-1.5 block">Evaluate against</label>
          <div className="space-y-1.5">
            {objectives.map((obj) => (
              <label
                key={obj.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedObjectiveIds.has(obj.id)}
                  onChange={() => toggleObjective(obj.id)}
                  disabled={running}
                  className="rounded"
                />
                <span className={selectedObjectiveIds.has(obj.id) ? "text-foreground" : "text-muted-foreground"}>
                  {obj.title}: {obj.metric} → {obj.target}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

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
    </div>
  );
}
