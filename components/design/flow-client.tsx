"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertTriangle, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { AgentMessage, CrewHealthStatus } from "@/lib/design-ops-types";
import type { Observation } from "@/lib/research-hub-types";

type Phase = "input" | "running" | "result";

interface FlowResult {
  frame: string;
  evidence: string[];
  recommendation: string;
  why: string;
}

export function FlowClient() {
  const [phase, setPhase] = useState<Phase>("input");
  const [problemStatement, setProblemStatement] = useState("");
  const [newObservation, setNewObservation] = useState("");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [observationsLoading, setObservationsLoading] = useState(true);
  const [addingObservation, setAddingObservation] = useState(false);
  const [health, setHealth] = useState<CrewHealthStatus | null>(null);
  const [result, setResult] = useState<FlowResult | null>(null);
  const [decision, setDecision] = useState<string | null>(null);

  // Load observations on mount
  useEffect(() => {
    fetchObservations();
    checkHealth();
  }, []);

  const fetchObservations = async () => {
    try {
      const res = await fetch("/api/design/research/observations");
      if (res.ok) {
        const data = await res.json();
        // Sort by most recent first and take last 10
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setObservations(sorted.slice(0, 10));
      }
    } catch {
      // Continue without observations
    } finally {
      setObservationsLoading(false);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await fetch("/api/design-ops/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch {
      setHealth({ status: "unavailable", ollama: "unknown", models: [], configuredModel: "unknown" });
    }
  };

  const handleAddObservation = async () => {
    if (!newObservation.trim()) {
      toast.error("Enter an observation");
      return;
    }

    setAddingObservation(true);
    try {
      const res = await fetch("/api/design/research/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: newObservation.trim(),
          area: "Flow",
          contributor: null,
          source_url: null,
        }),
      });

      if (res.ok) {
        setNewObservation("");
        await fetchObservations();
        toast.success("Observation added");
      } else {
        toast.error("Failed to add observation");
      }
    } catch {
      toast.error("Error adding observation");
    } finally {
      setAddingObservation(false);
    }
  };

  const handleRun = useCallback(async () => {
    if (!problemStatement.trim()) {
      toast.error("Enter a problem statement");
      return;
    }

    setPhase("running");
    setResult(null);
    setDecision(null);

    try {
      const res = await fetch("/api/design-ops/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: problemStatement.trim(),
          problem_statement: problemStatement.trim(),
          synthesis_tier: "balanced",
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
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      }

      // Parse result from messages
      const parseResult = parseMessages(messages);
      if (parseResult) {
        setResult(parseResult);
        setPhase("result");
        toast.success("Crew synthesis complete");
      } else {
        throw new Error("Could not parse crew response");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Crew run failed";
      toast.error(message);
      setPhase("input");
    }
  }, [problemStatement]);

  const parseMessages = (messages: AgentMessage[]): FlowResult | null => {
    let frame = "";
    let evidence: string[] = [];
    let recommendation = "";
    let why = "";

    for (const msg of messages) {
      try {
        const body = JSON.parse(msg.body);

        if (msg.from === "product_manager") {
          // Extract problem from strategic_frame
          frame = body.strategic_frame?.problem || "";
        } else if (msg.from === "research_insights") {
          // Extract findings
          if (body.what_we_know && Array.isArray(body.what_we_know)) {
            evidence = body.what_we_know.slice(0, 3).map((item: any) => item.finding || "");
          }
        } else if (msg.from === "product_designer") {
          // Extract recommendation
          if (body.ideas && body.ideas.length > 0) {
            recommendation = body.ideas[0].specific_change || "";
            why = body.ideas[0].why || "";
          }
        }
      } catch {
        // Continue parsing other messages
      }
    }

    if (frame || evidence.length > 0 || recommendation) {
      return { frame, evidence: evidence.filter(Boolean), recommendation, why };
    }

    return null;
  };

  const handleDecision = (value: string) => {
    setDecision(value);
  };

  const handleRunAgain = () => {
    setPhase("input");
    setResult(null);
    setDecision(null);
  };

  const crewUnavailable = health?.status === "unavailable";

  // Input Phase
  if (phase === "input") {
    return (
      <div className="p-6 space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black tracking-tight">Flow</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Research → Recommendation → Decision. Fast, focused synthesis.
          </p>
        </div>

        {/* Health warnings */}
        {crewUnavailable && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
            <AlertTriangle className="size-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400">
              Crew service unavailable. Start it with: <code className="bg-muted px-1 rounded">cd crew && source venv/bin/activate && uvicorn main:app --port 8000</code>
            </p>
          </div>
        )}

        {/* Problem statement */}
        <div className="space-y-3">
          <label className="text-sm font-semibold">Problem statement</label>
          <Textarea
            placeholder="What's the problem? (e.g., Users drop off during onboarding. 40% don't complete sign-up.)"
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            rows={4}
          />
        </div>

        {/* Observations */}
        <div className="space-y-3">
          <label className="text-sm font-semibold">Recent observations</label>
          {observationsLoading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : observations.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No observations yet</p>
          ) : (
            <div className="space-y-2">
              {observations.map((obs) => (
                <div key={obs.id} className="rounded-lg bg-muted p-3">
                  <p className="text-sm">{obs.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {obs.area} • {new Date(obs.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add observation */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add an observation from your team..."
            value={newObservation}
            onChange={(e) => setNewObservation(e.target.value)}
            rows={2}
          />
          <Button
            onClick={handleAddObservation}
            disabled={addingObservation || !newObservation.trim()}
            variant="outline"
            className="w-full"
          >
            <Plus className="size-4 mr-2" />
            Add observation
          </Button>
        </div>

        {/* Run button */}
        <Button
          onClick={handleRun}
          disabled={crewUnavailable || !problemStatement.trim()}
          className="w-full"
        >
          Run
        </Button>
      </div>
    );
  }

  // Running Phase
  if (phase === "running") {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="size-12 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Crew is thinking...</p>
      </div>
    );
  }

  // Result Phase
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Recommendation</h1>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Frame */}
          {result.frame && (
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Frame</h2>
              <p className="text-base leading-relaxed">{result.frame}</p>
            </div>
          )}

          {/* Evidence */}
          {result.evidence.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold">Evidence</h2>
              <ul className="space-y-2">
                {result.evidence.map((item, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="text-sm font-semibold text-muted-foreground shrink-0">
                      {idx + 1}.
                    </span>
                    <p className="text-base">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          {result.recommendation && (
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Recommendation</h2>
              <p className="text-base leading-relaxed font-semibold">{result.recommendation}</p>
              {result.why && (
                <>
                  <p className="text-sm text-muted-foreground">Why:</p>
                  <p className="text-base leading-relaxed">{result.why}</p>
                </>
              )}
            </div>
          )}

          {/* Decision */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">What next?</label>
            <div className="space-y-2">
              {decision ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
                  <CheckCircle className="size-4 text-green-500 shrink-0" />
                  <p className="text-sm font-medium">
                    {decision === "build" && "Noted — let's build this."}
                    {decision === "discuss" && "Added to discussion queue."}
                    {decision === "skip" && "Skipped for now."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={() => handleDecision("build")}
                    className="w-full justify-start"
                  >
                    ✓ Build this
                  </Button>
                  <Button
                    onClick={() => handleDecision("discuss")}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    💬 Discuss
                  </Button>
                  <Button
                    onClick={() => handleDecision("skip")}
                    variant="outline"
                    className="w-full justify-start text-destructive"
                  >
                    ✕ Skip
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Run again button */}
      <Button
        onClick={handleRunAgain}
        variant="outline"
        className="w-full"
      >
        Run again
      </Button>
    </div>
  );
}
