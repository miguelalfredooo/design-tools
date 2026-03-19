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

        return (
          <div key={i} className="relative">
            {!isLast && <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />}

            {/* Route to correct card component based on tier */}
            {msg.tier === "quick" ? (
              <SynthesisCardQuick
                from={msg.from as any}
                fromName={msg.fromName || ""}
                subject={msg.subject}
                confidence={msg.confidence as any}
                timestamp={msg.timestamp}
                tier="quick"
                headline={msg.subject}
                keyPoints={(msg.body || "").split("\n").filter(l => l.trim()).slice(0, 3)}
                isLast={isLast}
              />
            ) : msg.tier === "in-depth" ? (
              <SynthesisCardInDepth
                from={msg.from as any}
                fromName={msg.fromName || ""}
                subject={msg.subject}
                confidence={msg.confidence as any}
                timestamp={msg.timestamp}
                tier="in-depth"
                finding={msg.subject}
                evidence={[]}
                nextSteps={msg.body || ""}
                isLast={isLast}
              />
            ) : (
              <SynthesisCardBalanced
                from={msg.from as any}
                fromName={msg.fromName || ""}
                subject={msg.subject}
                confidence={msg.confidence as any}
                timestamp={msg.timestamp}
                tier="balanced"
                finding={msg.subject}
                evidence={[]}
                nextSteps={msg.body || ""}
                isLast={isLast}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
