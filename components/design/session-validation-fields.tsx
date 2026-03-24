"use client";

import type { SessionValidation } from "@/lib/design-types";
import { dataConfidenceCopy } from "@/lib/data-confidence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SessionValidationFieldsProps {
  value: SessionValidation;
  onChange: (next: SessionValidation) => void;
  compact?: boolean;
}

const validationStates = ["unverified", "in_review", "confirmed"] as const;

export function SessionValidationFields({
  value,
  onChange,
  compact = false,
}: SessionValidationFieldsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-medium">Evidence status</div>
        <p className="text-sm text-muted-foreground">
          Make the difference between directional signal and confirmed evidence explicit.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {validationStates.map((state) => {
          const copy = dataConfidenceCopy[state];
          return (
            <Button
              key={state}
              type="button"
              size="sm"
              variant={value.state === state ? "default" : "outline"}
              onClick={() => onChange({ ...value, state })}
            >
              {copy.badge}
            </Button>
          );
        })}
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-1" : "sm:grid-cols-3"}`}>
        <div className="space-y-1.5">
          <Label className="text-xs">Source owner</Label>
          <Input
            placeholder="Analytics, PM, designer..."
            value={value.evidenceSourceOwner ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                evidenceSourceOwner: event.target.value || undefined,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Source origin</Label>
          <Input
            placeholder="GA4 export, interview notes..."
            value={value.evidenceSourceOrigin ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                evidenceSourceOrigin: event.target.value || undefined,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Review date</Label>
          <Input
            type="date"
            value={value.evidenceSourceDate ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                evidenceSourceDate: event.target.value || undefined,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Validation note</Label>
        <Textarea
          rows={compact ? 2 : 3}
          placeholder="What still needs verification, or why is this evidence trusted?"
          value={value.note ?? ""}
          onChange={(event) =>
            onChange({
              ...value,
              note: event.target.value || undefined,
            })
          }
        />
      </div>
    </div>
  );
}
