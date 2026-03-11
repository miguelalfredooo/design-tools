"use client";

import { Brain, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AgentMessage } from "@/lib/design-ops-types";

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
            {/* Timeline connector */}
            {!isLast && (
              <div className="absolute left-5 top-12 bottom-0 w-px bg-border" />
            )}

            <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <CardHeader className="py-3 px-4">
                <div className="flex items-start gap-3">
                  {/* Agent avatar */}
                  <div className={cn("size-10 rounded-lg bg-muted flex items-center justify-center shrink-0", agent.color)}>
                    <Icon className="size-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Agent name + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-xs font-bold uppercase tracking-wider", agent.color)}>
                        {msg.fromName || agent.label}
                      </span>
                      <span className="text-xs text-muted-foreground">→ {msg.to === "user" ? "You" : AGENT_CONFIG[msg.to]?.label || msg.to}</span>
                      {msg.confidence !== "n/a" && (
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", CONFIDENCE_STYLES[msg.confidence])}>
                          {msg.confidence}
                        </Badge>
                      )}
                      {msg.priority === "critical" && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          critical
                        </Badge>
                      )}
                    </div>

                    {/* Subject */}
                    <CardTitle className="text-sm font-medium mt-1">{msg.subject}</CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-4 pt-0 ml-[52px]">
                {/* Body */}
                <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {msg.body}
                </div>

                {/* Assumptions */}
                {msg.assumptions && (
                  <details className="mt-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      Assumptions
                    </summary>
                    <p className="text-xs text-muted-foreground mt-1 pl-3 border-l-2 border-border">
                      {msg.assumptions}
                    </p>
                  </details>
                )}

                {/* Next step */}
                {msg.nextStep && (
                  <p className="text-xs text-muted-foreground mt-3 italic">
                    Next: {msg.nextStep}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
