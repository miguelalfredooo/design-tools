"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { useCreatorToolsFeedback } from "@/hooks/use-creator-tools-feedback";
import type { CreatorToolsFeedbackTarget } from "@/lib/creator-tools-feedback-types";
import { creatorToolsFeedbackReactionMeta } from "@/lib/creator-tools-feedback-types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SectionFeedbackProps extends CreatorToolsFeedbackTarget {
  className?: string;
}

export function SectionFeedback({
  page,
  targetId,
  targetType,
  className,
}: SectionFeedbackProps) {
  const { isAdmin } = useAdmin();
  const {
    counts,
    entries,
    currentEntry,
    reactionOrder,
    setReaction,
    saveNote,
  } = useCreatorToolsFeedback({
    page,
    targetId,
    targetType,
  });
  const [composerOpen, setComposerOpen] = useState(false);
  const [note, setNote] = useState(currentEntry?.note ?? "");

  return (
    <div className={cn("rounded-2xl border border-border/60 bg-secondary/15 p-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {reactionOrder.map((reaction) => {
          const meta = creatorToolsFeedbackReactionMeta[reaction];
          const isSelected = currentEntry?.reaction === reaction;

          return (
            <button
              key={reaction}
              type="button"
              onClick={() => setReaction(reaction)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{meta.shortLabel}</span>
              <span className={cn("tabular-nums", isSelected && "text-background/80")}>
                {counts[reaction]}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setComposerOpen((value) => !value)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <MessageSquarePlus className="size-3.5" />
          {currentEntry?.note ? "Edit note" : "Add note"}
        </button>
      </div>

      {composerOpen && (
        <div className="mt-3 space-y-2">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="What's working or not working here?"
            rows={3}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              Visible without attribution in the prototype. Admin can review authorship.
            </p>
            <Button
              size="sm"
              onClick={() => {
                saveNote(note);
                setComposerOpen(false);
              }}
              disabled={!note.trim()}
            >
              Save note
            </Button>
          </div>
        </div>
      )}

      {isAdmin && entries.length > 0 && (
        <details className="mt-3 rounded-xl border border-dashed border-border/60 bg-background/70 p-3">
          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
            Admin review ({entries.length})
          </summary>
          <div className="mt-3 space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border/50 bg-secondary/15 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {entry.voterName || "Anonymous stakeholder"}
                  </span>
                  <span>{entry.voterId.slice(0, 8)}</span>
                  {entry.reaction ? (
                    <span>{creatorToolsFeedbackReactionMeta[entry.reaction].label}</span>
                  ) : null}
                </div>
                {entry.note ? (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
