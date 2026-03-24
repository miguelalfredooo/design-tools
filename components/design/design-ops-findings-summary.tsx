"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { extractSection } from "@/lib/design-ops-formatting";
import type { AgentMessage } from "@/lib/design-ops-types";

interface DesignOpsFindingsSummaryProps {
  messages: AgentMessage[];
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-red-500/20 text-red-400 border-red-500/30",
};

export function DesignOpsFindingsSummary({ messages }: DesignOpsFindingsSummaryProps) {
  const synthesis = useMemo(
    () =>
      messages.find(
        (msg) => msg.from === "research_insights" && msg.confidence !== "n/a"
      ) ?? null,
    [messages]
  );

  if (!synthesis) {
    return (
      <p className="text-sm text-muted-foreground">
        Run an analysis to see results here.
      </p>
    );
  }

  const recommendation = extractSection(synthesis.body, "RECOMMENDATION");
  const topFindings = extractSection(synthesis.body, "TOP FINDINGS");
  const findingLines = topFindings
    .split("\n")
    .map((l) => l.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);

  const confidenceStyle =
    CONFIDENCE_STYLES[synthesis.confidence?.toLowerCase() ?? ""] ??
    "bg-muted text-muted-foreground";

  return (
    <div className="space-y-5">
      {/* Confidence */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Confidence
        </span>
        <Badge
          variant="outline"
          className={`text-xs font-semibold capitalize ${confidenceStyle}`}
        >
          {synthesis.confidence}
        </Badge>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recommendation
          </p>
          <p className="text-sm leading-6 text-foreground">{recommendation}</p>
        </div>
      )}

      {/* Top findings */}
      {findingLines.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Top findings
          </p>
          <ul className="space-y-1.5">
            {findingLines.map((finding, i) => (
              <li key={i} className="flex gap-2 text-sm leading-6 text-foreground">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {finding}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      {synthesis.nextStep && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Next steps
          </p>
          <p className="text-sm leading-6 text-foreground">{synthesis.nextStep}</p>
        </div>
      )}
    </div>
  );
}
