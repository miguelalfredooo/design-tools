"use client";

import { useState } from "react";
import { ChevronDown, Target, Crosshair, Users, ShieldCheck } from "lucide-react";
import type { ExplorationSession } from "@/lib/design-types";
import { cn } from "@/lib/utils";

interface SessionBriefProps {
  session: ExplorationSession;
}

const briefFields = [
  { key: "problem" as const, label: "Problem", icon: Target },
  { key: "goal" as const, label: "Goal", icon: Crosshair },
  { key: "audience" as const, label: "Audience", icon: Users },
  { key: "constraints" as const, label: "Constraints", icon: ShieldCheck },
];

export function SessionBrief({ session }: SessionBriefProps) {
  const [expanded, setExpanded] = useState(true);

  const hasBrief = session.problem || session.goal || session.audience || session.constraints;
  if (!hasBrief) return null;

  return (
    <div className="rounded-lg border bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        Context Brief
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && (
        <div className="grid gap-3 px-4 pb-4">
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
      )}
    </div>
  );
}
