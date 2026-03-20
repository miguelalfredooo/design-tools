"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CarrierInput } from "@/components/ui/carrier-input";
import { CarrierTextarea } from "@/components/ui/carrier-textarea";
import { Label } from "@/components/ui/label";

export interface SessionBriefData {
  title: string;
  description: string;
  problem: string;
  goal: string;
  audience: string;
  constraints: string;
  previewUrl: string;
}

interface SessionBriefFormProps {
  brief: SessionBriefData;
  onBriefChange: (field: keyof SessionBriefData, value: string) => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  showHeader?: boolean;
  inline?: boolean;
}

export function SessionBriefForm({
  brief,
  onBriefChange,
  expanded = true,
  onExpandedChange,
  showHeader = true,
  inline = false,
}: SessionBriefFormProps) {
  const handleToggle = () => {
    onExpandedChange?.(!expanded);
  };

  const content = (
    <div className="space-y-4">
      {/* Session title */}
      <div className="space-y-2">
        <CarrierInput
          placeholder="Session title..."
          value={brief.title}
          onChange={(e) => onBriefChange("title", e.target.value)}
          bordered
          designSize="md"
          className="font-semibold"
        />
      </div>

      {/* Session description */}
      <div className="space-y-2">
        <CarrierTextarea
          placeholder="Brief description for voters..."
          value={brief.description}
          onChange={(e) => onBriefChange("description", e.target.value)}
          rows={2}
          bordered
          designSize="sm"
        />
      </div>

      {/* Problem / Goal grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Problem</Label>
            <CarrierTextarea
              placeholder="What problem does this solve?"
              value={brief.problem}
              onChange={(e) => onBriefChange("problem", e.target.value)}
              rows={3}
              bordered
              designSize="sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Goal</Label>
            <CarrierTextarea
              placeholder="What's the desired outcome?"
              value={brief.goal}
              onChange={(e) => onBriefChange("goal", e.target.value)}
              rows={3}
              bordered
              designSize="sm"
            />
          </div>
        </div>

        {/* Audience / Constraints grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Audience</Label>
            <CarrierTextarea
              placeholder="Who is this for?"
              value={brief.audience}
              onChange={(e) => onBriefChange("audience", e.target.value)}
              rows={3}
              bordered
              designSize="sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">Constraints</Label>
            <CarrierTextarea
              placeholder="Any limitations?"
              value={brief.constraints}
              onChange={(e) => onBriefChange("constraints", e.target.value)}
              rows={3}
              bordered
              designSize="sm"
            />
          </div>
        </div>
      </div>

      {/* Preview URL */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Preview URL <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <CarrierInput
          placeholder="https://..."
          type="url"
          value={brief.previewUrl}
          onChange={(e) => onBriefChange("previewUrl", e.target.value)}
          bordered
          designSize="sm"
        />
      </div>
    </div>
  );

  // Inline mode (no header, always visible)
  if (inline) {
    return <div className="space-y-4">{content}</div>;
  }

  // Collapsible mode
  return (
    <div className="space-y-4">
      {showHeader && (
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground transition-colors"
        >
          Context Brief
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              !expanded && "-rotate-90"
            )}
          />
        </button>
      )}

      {expanded && content}
    </div>
  );
}
