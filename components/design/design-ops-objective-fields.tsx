"use client";

import { useId } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  designOpsSegments,
  growthMetricOptions,
  lifecycleCohortOptions,
} from "@/lib/mock/design-ops-growth-context";
import type { Objective, LifecycleCohort } from "@/lib/design-ops-types";
import { DesignOpsMultiSelect } from "@/components/design/design-ops-multi-select";
import { LiveDraftHeaderFields } from "@/components/design/live-draft-header-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ObjectiveFormValues = Omit<Objective, "id" | "createdAt">;

interface DesignOpsObjectiveFieldsProps {
  value: ObjectiveFormValues;
  onChange: (next: ObjectiveFormValues) => void;
  showAdvanced: boolean;
  onShowAdvancedChange: (next: boolean) => void;
  appearance?: "default" | "inline";
}

export function makeDefaultObjectiveFormValues(): ObjectiveFormValues {
  return {
    title: "",
    metric: growthMetricOptions[0]?.value ?? "",
    target: "",
    description: "",
    segmentIds: [],
    lifecycleCohorts: [],
    theoryOfSuccess: "",
  };
}

export function DesignOpsObjectiveFields({
  value,
  onChange,
  showAdvanced,
  onShowAdvancedChange,
  appearance = "default",
}: DesignOpsObjectiveFieldsProps) {
  const idBase = useId();
  const update = <K extends keyof ObjectiveFormValues>(
    key: K,
    nextValue: ObjectiveFormValues[K]
  ) => {
    onChange({ ...value, [key]: nextValue });
  };

  const toggleSegment = (segmentId: string) => {
    update(
      "segmentIds",
      value.segmentIds.includes(segmentId)
        ? value.segmentIds.filter((id) => id !== segmentId)
        : [...value.segmentIds, segmentId]
    );
  };

  const toggleLifecycleCohort = (cohort: string) => {
    const next = value.lifecycleCohorts.includes(cohort as LifecycleCohort)
      ? value.lifecycleCohorts.filter((entry) => entry !== cohort)
      : [...value.lifecycleCohorts, cohort as LifecycleCohort];
    update("lifecycleCohorts", next);
  };

  const isInline = appearance === "inline";
  const inlineInputClassName =
    "w-full border-none bg-transparent px-0 shadow-none outline-none ring-0 placeholder:text-lg placeholder:text-muted-foreground/35 focus-visible:ring-0 focus-visible:ring-offset-0";
  const inlineBodyClassName = `${inlineInputClassName} text-base text-muted-foreground resize-none`;

  return (
    <div className="space-y-3">
      {isInline ? (
        <div className="pb-8">
          <LiveDraftHeaderFields
            titleId={`${idBase}-title`}
            descriptionId={`${idBase}-description`}
            titleLabel="Objective"
            descriptionLabel="Problem / Opportunity"
            titlePlaceholder="What outcome are we trying to move?"
            descriptionPlaceholder="What friction, gap, or growth opportunity makes this worth solving?"
            titleValue={value.title}
            descriptionValue={value.description}
            onTitleChange={(next) => update("title", next)}
            onDescriptionChange={(next) => update("description", next)}
            density="inline"
            emphasis="large"
            titleTone="field"
          />
        </div>
      ) : (
        <>
          <span className="do-section-label">1. Objective</span>
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-title`} className="text-sm font-semibold">
              Objective
            </Label>
            <p className="text-xs leading-5 text-muted-foreground">
              Frame this like a decision brief, not a taxonomy record.
            </p>
          </div>
          <Textarea
            id={`${idBase}-title`}
            placeholder="Objective (e.g., Improve content match discovery from onboarding interests)"
            value={value.title}
            onChange={(e) => update("title", e.target.value)}
            rows={2}
          />
          <span className="do-section-label">2. Problem / Opportunity</span>
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-description`} className="text-sm font-semibold">
              Problem / Opportunity
            </Label>
            <p className="text-xs leading-5 text-muted-foreground">
              What friction, gap, or growth opportunity are we trying to address?
            </p>
          </div>
          <Textarea
            id={`${idBase}-description`}
            placeholder="Users currently select interests in onboarding, but we only translate that into a flat list of community categories. We should use interests across discovery, feed, email, and re-engagement."
            value={value.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
          />
        </>
      )}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Primary metric</Label>
        <div className="flex flex-wrap gap-2">
          {growthMetricOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update("metric", option.value)}
              className={cn(
                "px-3 py-1 rounded-full text-sm border transition-colors",
                value.metric === option.value
                  ? "bg-[#E8624A] text-white border-[#E8624A]"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="do-ctx-toggle"
        onClick={() => onShowAdvancedChange(!showAdvanced)}
      >
        {showAdvanced ? (
          <><ChevronUp className="size-3" /> Hide context</>
        ) : (
          <><ChevronDown className="size-3" /> Add context (optional)</>
        )}
      </button>

      {showAdvanced && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Additional context</p>
          {/* Target */}
          <div className="space-y-1 pb-8">
            <Label htmlFor={`${idBase}-target`} className="text-sm font-semibold">Target</Label>
            <Input
              id={`${idBase}-target`}
              placeholder="Target (e.g., Increase 7-day return rate for newly onboarded users)"
              value={value.target}
              onChange={(e) => update("target", e.target.value)}
            />
          </div>
          {/* Theory of success */}
          <div className="space-y-1 pb-8">
            <Label htmlFor={`${idBase}-theory`} className="text-sm font-semibold">Why this might work</Label>
            <Textarea
              id={`${idBase}-theory`}
              placeholder="If we use stated interests to recommend communities, posts, email content, and follow-up prompts, users will find relevant content faster and return more often."
              value={value.theoryOfSuccess ?? ""}
              onChange={(e) => update("theoryOfSuccess", e.target.value)}
              rows={3}
            />
          </div>
          {/* Segments */}
          <DesignOpsMultiSelect
            id={`${idBase}-segments`}
            label="Segments"
            description="Which creator or community segments should this objective apply to?"
            placeholder="Choose one or more segments"
            placeholderClassName="text-lg"
            options={designOpsSegments.map((segment) => ({
              value: segment.id,
              label: segment.name,
              description: segment.description,
            }))}
            selectedValues={value.segmentIds}
            onToggle={toggleSegment}
          />
          {/* User stages */}
          <DesignOpsMultiSelect
            id={`${idBase}-cohorts`}
            label="User stages"
            description="Which in-product user behaviors matter most for this objective?"
            placeholder="Choose one or more cohorts"
            placeholderClassName="text-lg"
            options={lifecycleCohortOptions.map((cohort) => ({
              value: cohort.value,
              label: cohort.label,
              description: cohort.description,
            }))}
            selectedValues={value.lifecycleCohorts}
            onToggle={toggleLifecycleCohort}
          />
        </div>
      )}
    </div>
  );
}
