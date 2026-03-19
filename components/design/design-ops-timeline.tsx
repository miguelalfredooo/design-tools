"use client";

import { Brain, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentMessage } from "@/lib/design-ops-types";
import {
  SynthesisCardQuick,
  SynthesisCardBalanced,
  SynthesisCardInDepth,
  type SynthesisCardQuickProps,
  type SynthesisCardBalancedProps,
  type SynthesisCardInDepthProps,
} from "@/components/design/synthesis-cards";

// Parser functions for tier-specific crew output formats
function parseQuickOutput(body: string): { headline: string; keyPoints: string[] } {
  const lines = body.split("\n").filter((l) => l.trim());

  // Look for HEADLINE or KEY PATTERNS sections
  let headline = "";
  const keyPoints: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("HEADLINE:")) {
      headline = line.replace("HEADLINE:", "").trim();
    } else if (line.includes("KEY PATTERNS:")) {
      // Collect bullet points until next section
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].includes(":") && !lines[j].startsWith("-") && !lines[j].startsWith("•")) {
          break;
        }
        const clean = lines[j].replace(/^[-•]\s*/, "").trim();
        if (clean) keyPoints.push(clean);
      }
      break;
    }
  }

  // Fallback: first line as headline, next 3 as key points
  if (!headline) {
    headline = lines[0] || "";
    keyPoints.push(...lines.slice(1, 4));
  }

  return {
    headline,
    keyPoints: keyPoints.slice(0, 3), // Ensure max 3
  };
}

function parseBalancedOutput(body: string): {
  finding: string;
  evidence: string[];
  nextSteps: string;
} {
  const lines = body.split("\n").filter((l) => l.trim());

  let finding = "";
  const evidence: string[] = [];
  let nextSteps = "";
  let inEvidenceSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("SUBJECT:")) {
      finding = line.replace("SUBJECT:", "").trim();
    } else if (line.includes("FINDINGS:") || line.includes("EVIDENCE:")) {
      inEvidenceSection = true;
    } else if (line.includes("NEXT STEPS:") || line.includes("NEXT STEP:")) {
      inEvidenceSection = false;
      nextSteps = line.replace(/NEXT STEPS?:/, "").trim();
      // Collect remaining content as next steps
      if (!nextSteps) {
        for (let j = i + 1; j < lines.length; j++) {
          if (!lines[j].includes(":")) {
            nextSteps = lines[j].replace(/^[-•]\s*/, "").trim();
            break;
          }
        }
      }
    } else if (inEvidenceSection && (line.startsWith("-") || line.startsWith("•"))) {
      const clean = line.replace(/^[-•]\s*/, "").trim();
      if (clean && evidence.length < 3) {
        evidence.push(clean);
      }
    }
  }

  // Fallback
  if (!finding) finding = lines[0] || "";
  if (!nextSteps) nextSteps = lines[lines.length - 1] || "";

  return { finding, evidence, nextSteps };
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
  const lines = body.split("\n").filter((l) => l.trim());

  let finding = "";
  const evidence: string[] = [];
  let competingInterpretations = "";
  let assumptions = "";
  const sources: string[] = [];
  let nextSteps = "";
  let missingContext = "";

  let currentSection = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.includes("SUBJECT:")) {
      finding = line.replace("SUBJECT:", "").trim();
      currentSection = "subject";
    } else if (line.includes("ASSUMPTIONS:")) {
      currentSection = "assumptions";
      assumptions = line.replace("ASSUMPTIONS:", "").trim();
    } else if (line.includes("FINDINGS:") || line.includes("EVIDENCE:")) {
      currentSection = "evidence";
    } else if (line.includes("COMPETING INTERPRETATIONS:")) {
      currentSection = "competing";
      competingInterpretations = line.replace("COMPETING INTERPRETATIONS:", "").trim();
    } else if (line.includes("NEXT STEPS:")) {
      currentSection = "next";
      nextSteps = line.replace("NEXT STEPS:", "").trim();
    } else if (line.includes("MISSING CONTEXT:")) {
      currentSection = "missing";
      missingContext = line.replace("MISSING CONTEXT:", "").trim();
    } else if (line.includes("SOURCES:")) {
      currentSection = "sources";
    } else if (
      currentSection === "evidence" &&
      (line.startsWith("-") || line.startsWith("•"))
    ) {
      const clean = line.replace(/^[-•]\s*/, "").trim();
      if (clean && evidence.length < 4) {
        evidence.push(clean);
      }
    } else if (
      currentSection === "sources" &&
      (line.startsWith("-") || line.startsWith("•"))
    ) {
      const clean = line.replace(/^[-•]\s*/, "").trim();
      if (clean) sources.push(clean);
    }
  }

  // Fallback for finding
  if (!finding) finding = lines[0] || "";
  if (!nextSteps) nextSteps = lines[lines.length - 1] || "";

  return {
    finding,
    evidence,
    ...(competingInterpretations && { competingInterpretations }),
    ...(assumptions && { assumptions }),
    ...(sources.length > 0 && { sources }),
    nextSteps,
    ...(missingContext && { missingContext }),
  };
}

interface DesignOpsTimelineProps {
  messages: AgentMessage[];
}

const AGENT_CONFIG: Record<string, { icon: typeof Brain; color: string; label: string }> = {
  design_ops_manager: { icon: Brain, color: "text-violet-400", label: "ORACLE" },
  research_synthesizer: { icon: FlaskConical, color: "text-emerald-400", label: "MERIDIAN" },
};

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-red-500/20 text-red-400 border-red-500/30",
  "n/a": "bg-muted text-muted-foreground",
};

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
        const agent = AGENT_CONFIG[msg.from] || AGENT_CONFIG.design_ops_manager;
        const Icon = agent.icon;
        const isLast = i === messages.length - 1;

        // Common props for all card types
        const commonProps = {
          from: msg.from as any,
          fromName: msg.fromName || "",
          subject: msg.subject,
          confidence: msg.confidence as any,
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
