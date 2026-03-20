"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CrewTestPage() {
  const [problem, setProblem] = useState(
    "Creators are underengaged — no visibility into what's working, no tools to maintain presence efficiently."
  );
  const [metric, setMetric] = useState("Consistent posting frequency + engagement + pageview growth");
  const [userSegment, setUserSegment] = useState("Content creators on Raptive Community");

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");

  async function runCrew() {
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await fetch("/api/crew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_statement: problem,
          metric,
          user_segment: userSegment,
          stage: "discovery",
          synthesis_tier: "quick",
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Crew Test</h1>
        <p className="text-muted-foreground">Debug the three-agent handoff</p>
      </div>

      {/* Input Section */}
      <div className="space-y-4 border rounded-lg p-6 bg-card">
        <div>
          <label className="block text-sm font-medium mb-2">Problem</label>
          <textarea
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            className="w-full p-2 border rounded text-sm"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Metric</label>
          <input
            type="text"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">User Segment</label>
          <input
            type="text"
            value={userSegment}
            onChange={(e) => setUserSegment(e.target.value)}
            className="w-full p-2 border rounded text-sm"
          />
        </div>

        <Button onClick={runCrew} disabled={loading} className="w-full">
          {loading ? "Running..." : "Run Crew"}
        </Button>
      </div>

      {/* Error Section */}
      {error && (
        <div className="border border-destructive rounded-lg p-4 bg-destructive/10">
          <p className="text-destructive text-sm font-medium">Error: {error}</p>
        </div>
      )}

      {/* Results Section */}
      {results && (
        <div className="space-y-6">
          {/* PM Output */}
          <div className="border rounded-lg p-6 bg-card space-y-2">
            <h2 className="text-lg font-bold text-green-600">1. PM OUTPUT</h2>
            <p className="text-sm font-medium text-muted-foreground">
              Should be: Frame + Assumptions (HIGH/MED/LOW) + Constraints + Trade-off
            </p>
            <div className="mt-4 p-4 bg-muted rounded border border-border text-sm whitespace-pre-wrap font-mono text-xs">
              {results.pm_frame}
            </div>
          </div>

          {/* Research Output */}
          <div className="border rounded-lg p-6 bg-card space-y-2">
            <h2 className="text-lg font-bold text-blue-600">2. RESEARCH OUTPUT</h2>
            <p className="text-sm font-medium text-muted-foreground">
              Should be: Pressure-test + Confidence ratings + Closing line about what to validate
            </p>
            <div className="mt-4 p-4 bg-muted rounded border border-border text-sm whitespace-pre-wrap font-mono text-xs">
              {results.research_synthesis}
            </div>
          </div>

          {/* Designer Output */}
          <div className="border rounded-lg p-6 bg-card space-y-2">
            <h2 className="text-lg font-bold text-purple-600">3. DESIGNER OUTPUT</h2>
            <p className="text-sm font-medium text-muted-foreground">
              Should be: 2-3 ideas + Assumptions + Trade-offs + Critique anchor
            </p>
            <div className="mt-4 p-4 bg-muted rounded border border-border text-sm whitespace-pre-wrap font-mono text-xs">
              {results.design_recommendation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
