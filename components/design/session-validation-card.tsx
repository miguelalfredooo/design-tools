"use client";

import { useEffect, useState } from "react";
import { FileCheck2 } from "lucide-react";
import { toast } from "sonner";
import type { ExplorationSession, SessionValidation } from "@/lib/design-types";
import { dataConfidenceCopy } from "@/lib/data-confidence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SessionValidationFields } from "@/components/design/session-validation-fields";

interface SessionValidationCardProps {
  session: ExplorationSession;
  isCreator: boolean;
  onUpdate: (updates: Partial<SessionValidation>) => Promise<void>;
}

export function SessionValidationCard({
  session,
  isCreator,
  onUpdate,
}: SessionValidationCardProps) {
  const [draft, setDraft] = useState<SessionValidation>(
    session.validation ?? { state: "unverified" }
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(session.validation ?? { state: "unverified" });
  }, [session.id, session.validation]);

  const confidence = dataConfidenceCopy[draft.state];

  async function saveDraft(nextDraft: SessionValidation) {
    setSaving(true);
    try {
      await onUpdate(nextDraft);
      toast.success("Evidence status updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update evidence status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <FileCheck2 className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">Evidence status</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Show whether this session is still directional or ready to stand up as confirmed evidence.
          </p>
        </div>
        <Badge variant="outline" className={confidence.className}>
          {confidence.badge}
        </Badge>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Detail
          label="Source owner"
          value={draft.evidenceSourceOwner || "Not attached yet"}
        />
        <Detail
          label="Origin"
          value={draft.evidenceSourceOrigin || "No source linked"}
        />
        <Detail
          label="Reviewed"
          value={draft.evidenceSourceDate || "No review date"}
        />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {draft.note ||
          (draft.state === "confirmed"
            ? "Confirmed evidence is attached and ready to reference in a drop."
            : draft.state === "in_review"
              ? "This session has signal worth discussing, but the evidence still needs review."
              : "Treat this as directional signal until a source owner and review date are attached.")}
      </p>

      {draft.state !== "confirmed" ? (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          Confirm at least one evidence anchor before using this in a drop or stakeholder recommendation.
        </div>
      ) : null}

      {isCreator ? (
        <div className="mt-4 space-y-3 border-t pt-4">
          <SessionValidationFields value={draft} onChange={setDraft} compact />

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => saveDraft(draft)}
            >
              {saving ? "Saving..." : "Save evidence status"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background/80 px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
