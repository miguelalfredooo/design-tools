"use client";

import type { AgentMessage } from "@/lib/design-ops-types";
import {
  SynthesisCardQuick,
  SynthesisCardBalanced,
  SynthesisCardInDepth,
} from "@/components/design/synthesis-cards";

// Parser functions for tier-specific crew output formats
// All body fields are JSON strings that need parsing

function parseQuickOutput(
  body: string
): { headline: string; keyPoints: string[] } {
  try {
    const data = JSON.parse(body);

    // PM output failures
    if (data.status === "fail" || data.gaps) {
      return {
        headline: "⚠️ Frame validation failed",
        keyPoints: data.gaps?.slice(0, 3) || [],
      };
    }

    // PM output: strategic_frame.problem, assumptions
    if (data.strategic_frame) {
      return {
        headline: data.strategic_frame.problem || "",
        keyPoints: data.assumptions
          ?.slice(0, 3)
          .map((a: any) => a.statement || "")
          .filter(Boolean) || [],
      };
    }

    // Research output: what_we_know
    if (data.what_we_know) {
      return {
        headline: data.highest_risk_assumption || "",
        keyPoints: data.what_we_know
          ?.slice(0, 3)
          .map((item: any) => item.finding || "")
          .filter(Boolean) || [],
      };
    }

    // Design output: objective, ideas
    if (data.objective) {
      return {
        headline: data.objective || "",
        keyPoints: data.ideas
          ?.slice(0, 3)
          .map((idea: any) => idea.specific_change || "")
          .filter(Boolean) || [],
      };
    }

    return { headline: "", keyPoints: [] };
  } catch {
    return { headline: "", keyPoints: [] };
  }
}

function parseBalancedOutput(body: string): {
  finding: string;
  evidence: string[];
  nextSteps: string;
} {
  try {
    const data = JSON.parse(body);

    // PM output (including failures)
    if (data.status === "fail" || data.gaps) {
      return {
        finding: "⚠️ Frame validation failed",
        evidence: data.gaps?.slice(0, 3) || [],
        nextSteps: "Refine the problem statement with more specificity",
      };
    }

    // PM output (successful)
    if (data.strategic_frame) {
      return {
        finding: data.strategic_frame.problem || "",
        evidence: data.constraints?.slice(0, 3) || [],
        nextSteps: data.tradeoff || "",
      };
    }

    // Research output
    if (data.what_we_know) {
      return {
        finding: data.highest_risk_assumption || "",
        evidence: data.what_we_know
          ?.slice(0, 3)
          .map((item: any) => item.finding || "")
          .filter(Boolean) || [],
        nextSteps: data.next_step || "",
      };
    }

    // Design output
    if (data.objective) {
      return {
        finding: data.objective || "",
        evidence: data.ideas
          ?.slice(0, 2)
          .map((idea: any) => idea.specific_change || "")
          .filter(Boolean) || [],
        nextSteps: data.critique_anchor?.alternative || "",
      };
    }

    return { finding: "", evidence: [], nextSteps: "" };
  } catch {
    return { finding: "", evidence: [], nextSteps: "" };
  }
}

function parseInDepthOutput(body: string): {
  finding: string;
  evidence: string[];
  competingInterpretations?: string;
  assumptions?: string;
  sources?: string[];
  nextSteps: string;
  missingContext?: string;
} {
  try {
    const data = JSON.parse(body);

    // PM output failures
    if (data.status === "fail" || data.gaps) {
      return {
        finding: "⚠️ Frame validation failed",
        evidence: data.gaps?.slice(0, 4) || [],
        assumptions: "Refine the problem statement with more specificity",
        nextSteps: "Address all gaps before proceeding",
        missingContext: data.gaps?.join("; ") || "",
      };
    }

    // PM output (successful)
    if (data.strategic_frame) {
      return {
        finding: data.strategic_frame.problem || "",
        evidence: data.constraints?.slice(0, 4) || [],
        assumptions: data.strategic_frame.user || "",
        nextSteps: data.tradeoff || "",
        missingContext: data.gaps?.join(", ") || "",
      };
    }

    // Research output
    if (data.what_we_know) {
      return {
        finding: data.highest_risk_assumption || "",
        evidence: data.what_we_know
          ?.slice(0, 4)
          .map((item: any) => item.finding || "")
          .filter(Boolean) || [],
        assumptions:
          data.what_we_dont_know?.[0] ||
          data.assumption_status?.[0]?.assumption ||
          "",
        nextSteps: data.next_step || "",
        sources: [],
      };
    }

    // Design output
    if (data.objective) {
      return {
        finding: data.objective || "",
        evidence: data.ideas
          ?.slice(0, 3)
          .map((idea: any) => idea.specific_change || "")
          .filter(Boolean) || [],
        competingInterpretations: data.critique_anchor?.alternative || "",
        assumptions: data.ideas?.[0]?.assumption_tested || "",
        nextSteps: data.critique_anchor?.tradeoff || "",
      };
    }

    return {
      finding: "",
      evidence: [],
      nextSteps: "",
    };
  } catch {
    return {
      finding: "",
      evidence: [],
      nextSteps: "",
    };
  }
}

interface DesignOpsTimelineProps {
  messages: AgentMessage[];
}

export function DesignOpsTimeline({ messages }: DesignOpsTimelineProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">
          No crew runs yet. Define objectives and trigger a synthesis.
        </p>
      </div>
    );
  }

  // Group messages by iteration
  const messagesByIteration = new Map<number, typeof messages>();
  for (const msg of messages) {
    const iter = msg.iteration ?? 1;
    if (!messagesByIteration.has(iter)) {
      messagesByIteration.set(iter, []);
    }
    messagesByIteration.get(iter)!.push(msg);
  }

  const iterations = Array.from(messagesByIteration.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {iterations.map((iter, iterIndex) => {
        const iterMessages = messagesByIteration.get(iter)!;
        const showIterDivider = iterIndex > 0;

        return (
          <div key={iter}>
            {/* Iteration divider */}
            {showIterDivider && (
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Iteration {iter}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}

            {/* Messages for this iteration */}
            <div className="space-y-4">
              {iterMessages.map((msg, i) => {
                const isLastInIteration = i === iterMessages.length - 1;
                const isLastOverall = iter === iterations[iterations.length - 1] && isLastInIteration;

                // Common props for all card types
                const commonProps = {
                  from: msg.from as "research_insights" | "product_designer" | "product_manager",
                  fromName: msg.fromName || "",
                  subject: msg.subject,
                  confidence: msg.confidence as "high" | "medium" | "low" | "n/a",
                  timestamp: msg.timestamp,
                  isLast: isLastOverall,
                };

                // Determine tier (default to balanced if not set)
                const tier = msg.tier || "balanced";

                return (
                  <div key={`${iter}-${i}`} className="relative">
                    {!(isLastInIteration && iterIndex === iterations.length - 1) && (
                      <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />
                    )}

                    {/* Route to correct card component based on tier */}
                    {tier === "quick" ? (
                      <SynthesisCardQuick
                        {...commonProps}
                        tier="quick"
                        {...parseQuickOutput(msg.body || "")}
                      />
                    ) : tier === "in-depth" ? (
                      <SynthesisCardInDepth
                        {...commonProps}
                        tier="in-depth"
                        {...parseInDepthOutput(msg.body || "")}
                      />
                    ) : (
                      <SynthesisCardBalanced
                        {...commonProps}
                        tier="balanced"
                        {...parseBalancedOutput(msg.body || "")}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
