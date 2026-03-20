"use client";

import { Check, AlertCircle, HelpCircle, Zap, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommonCardProps {
  from: "research_insights" | "product_designer" | "product_manager";
  fromName: string;
  subject: string;
  confidence: "high" | "medium" | "low" | "n/a";
  timestamp: string;
  isLast: boolean;
  tier: "quick" | "balanced" | "in-depth";
}

// Helper: Confidence indicator
function ConfidenceIcon({
  level,
}: {
  level: "high" | "medium" | "low" | "n/a";
}) {
  switch (level) {
    case "high":
      return <Check className="size-3.5 text-green-900 dark:text-green-200" />;
    case "medium":
      return <AlertCircle className="size-3.5 text-amber-900 dark:text-amber-200" />;
    case "low":
      return <HelpCircle className="size-3.5 text-red-900 dark:text-red-200" />;
    case "n/a":
      return <MoreHorizontal className="size-3.5 text-muted-foreground" />;
  }
}

// Helper: Agent color
function getAgentColor(
  from: "research_insights" | "product_designer" | "product_manager"
) {
  switch (from) {
    case "research_insights":
      return "bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-200";
    case "product_designer":
      return "bg-purple-500/10 border-purple-500/20 text-purple-900 dark:text-purple-200";
    case "product_manager":
      return "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200";
  }
}

// QUICK TIER - minimal output
interface SynthesisCardQuickProps extends CommonCardProps {
  headline: string;
  keyPoints: string[];
}

export function SynthesisCardQuick({
  from,
  fromName,
  subject,
  confidence,
  timestamp,
  isLast,
  headline,
  keyPoints,
}: SynthesisCardQuickProps) {
  const agentColorClass = getAgentColor(from);
  const time = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-0 top-3 w-3 h-3 rounded-full border-2 border-background z-10",
          agentColorClass
        )}
      />

      {/* Card */}
      <div
        className={cn(
          "ml-8 rounded-lg border p-4 space-y-3",
          agentColorClass
        )}
      >
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
                {fromName}
              </p>
              <h3 className="text-sm font-semibold">{subject}</h3>
            </div>
            <ConfidenceIcon level={confidence} />
          </div>
        </div>

        {/* Headline */}
        {headline && <p className="text-sm">{headline}</p>}

        {/* Key points */}
        {keyPoints.length > 0 && (
          <ul className="space-y-1.5 text-sm">
            {keyPoints.map((point, i) => (
              <li key={i} className="flex gap-2 items-start">
                <Zap className="size-3 mt-0.5 shrink-0 opacity-60" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground pt-2 border-t border-current border-opacity-10">
          {time}
        </p>
      </div>
    </div>
  );
}

// BALANCED TIER - standard output
interface SynthesisCardBalancedProps extends CommonCardProps {
  finding: string;
  evidence: string[];
  nextSteps: string;
}

export function SynthesisCardBalanced({
  from,
  fromName,
  subject,
  confidence,
  timestamp,
  isLast,
  finding,
  evidence,
  nextSteps,
}: SynthesisCardBalancedProps) {
  const agentColorClass = getAgentColor(from);
  const time = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-0 top-3 w-3 h-3 rounded-full border-2 border-background z-10",
          agentColorClass
        )}
      />

      {/* Card */}
      <div
        className={cn(
          "ml-8 rounded-lg border p-4 space-y-3",
          agentColorClass
        )}
      >
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
                {fromName}
              </p>
              <h3 className="text-sm font-semibold">{subject}</h3>
            </div>
            <ConfidenceIcon level={confidence} />
          </div>
        </div>

        {/* Finding */}
        {finding && <p className="text-sm font-medium">{finding}</p>}

        {/* Evidence */}
        {evidence.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide opacity-60">Evidence</p>
            <ul className="space-y-1.5 text-sm">
              {evidence.map((item, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <Check className="size-3 mt-0.5 shrink-0 opacity-60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {nextSteps && (
          <div className="pt-2 border-t border-current border-opacity-10 space-y-1">
            <p className="text-xs uppercase tracking-wide opacity-60">Next Step</p>
            <p className="text-sm">{nextSteps}</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground pt-2 border-t border-current border-opacity-10">
          {time}
        </p>
      </div>
    </div>
  );
}

// IN-DEPTH TIER - comprehensive output
interface SynthesisCardInDepthProps extends CommonCardProps {
  finding: string;
  evidence: string[];
  competingInterpretations?: string;
  assumptions?: string;
  sources?: string[];
  nextSteps: string;
  missingContext?: string;
}

export function SynthesisCardInDepth({
  from,
  fromName,
  subject,
  confidence,
  timestamp,
  isLast,
  finding,
  evidence,
  competingInterpretations,
  assumptions,
  sources,
  nextSteps,
  missingContext,
}: SynthesisCardInDepthProps) {
  const agentColorClass = getAgentColor(from);
  const time = new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div
        className={cn(
          "absolute left-0 top-3 w-3 h-3 rounded-full border-2 border-background z-10",
          agentColorClass
        )}
      />

      {/* Card */}
      <div
        className={cn(
          "ml-8 rounded-lg border p-4 space-y-4",
          agentColorClass
        )}
      >
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-75">
                {fromName}
              </p>
              <h3 className="text-sm font-semibold">{subject}</h3>
            </div>
            <ConfidenceIcon level={confidence} />
          </div>
        </div>

        {/* Finding */}
        {finding && <p className="text-sm font-medium">{finding}</p>}

        {/* Evidence */}
        {evidence.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide opacity-60">Evidence</p>
            <ul className="space-y-1.5 text-sm">
              {evidence.map((item, i) => (
                <li key={i} className="flex gap-2 items-start">
                  <Check className="size-3 mt-0.5 shrink-0 opacity-60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Assumptions */}
        {assumptions && (
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide opacity-60">Key Assumption</p>
            <p className="text-sm">{assumptions}</p>
          </div>
        )}

        {/* Competing Interpretations */}
        {competingInterpretations && (
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide opacity-60">
              Alternative Reading
            </p>
            <p className="text-sm">{competingInterpretations}</p>
          </div>
        )}

        {/* Missing Context */}
        {missingContext && (
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide opacity-60">Gap</p>
            <p className="text-sm">{missingContext}</p>
          </div>
        )}

        {/* Sources */}
        {sources && sources.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wide opacity-60">Sources</p>
            <ul className="space-y-1 text-xs">
              {sources.map((source, i) => (
                <li key={i} className="text-muted-foreground">
                  • {source}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {nextSteps && (
          <div className="pt-2 border-t border-current border-opacity-10 space-y-1">
            <p className="text-xs uppercase tracking-wide opacity-60">Next Step</p>
            <p className="text-sm">{nextSteps}</p>
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground pt-2 border-t border-current border-opacity-10">
          {time}
        </p>
      </div>
    </div>
  );
}
