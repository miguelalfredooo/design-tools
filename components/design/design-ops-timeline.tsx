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

    // PM output
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

    // PM output
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

  return (
    <div className="space-y-4">
      {messages.map((msg, i) => {
        const isLast = i === messages.length - 1;

        // Common props for all card types
        const commonProps = {
          from: msg.from as "research_insights" | "product_designer" | "product_manager",
          fromName: msg.fromName || "",
          subject: msg.subject,
          confidence: msg.confidence as "high" | "medium" | "low" | "n/a",
          timestamp: msg.timestamp,
          isLast,
        };

        // Determine tier (default to balanced if not set)
        const tier = msg.tier || "balanced";

        return (
          <div key={i} className="relative">
            {!isLast && <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />}

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
  );
}
