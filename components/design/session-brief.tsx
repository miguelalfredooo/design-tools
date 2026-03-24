"use client";

import { useState } from "react";
import { ChevronDown, Target, Crosshair, Users, ShieldCheck, Tag, FlaskConical } from "lucide-react";
import type { ExplorationSession } from "@/lib/design-types";
import { cn } from "@/lib/utils";
import { BriefFramingSequence } from "@/components/design/brief-framing-sequence";

interface SessionBriefProps {
  session: ExplorationSession;
}

const briefFields = [
  { key: "topic" as const, label: "Topic area", icon: Tag },
  { key: "hypothesis" as const, label: "Hypothesis", icon: FlaskConical },
  { key: "goal" as const, label: "Goal", icon: Crosshair },
  { key: "problem" as const, label: "Problem / Opportunity", icon: Target },
  { key: "audience" as const, label: "Audience", icon: Users },
  { key: "constraints" as const, label: "Constraints", icon: ShieldCheck },
];

export function SessionBrief({ session }: SessionBriefProps) {
  const [expanded, setExpanded] = useState(true);

  const hasBrief = session.topic || session.hypothesis || session.problem || session.goal || session.audience || session.constraints;
  if (!hasBrief) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Context Brief
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <div className="mt-3 space-y-4">
          <BriefFramingSequence compact />
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 w-full">
            {briefFields.map(({ key, label, icon: Icon }) => {
              const value = session[key];
              if (!value) return null;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Icon className="size-3" />
                    {label}
                  </div>
                  <p className="text-sm">{value}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
