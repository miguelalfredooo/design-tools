"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";

interface VoterIdentityDialogProps {
  open: boolean;
  onSubmit: (name: string, comment?: string) => void;
  onCancel?: () => void;
  existingNames: string[];
  /** Context changes the dialog copy. Default is "vote". */
  context?: "vote" | "comment";
}

export function VoterIdentityDialog({
  open,
  onSubmit,
  onCancel,
  existingNames,
  context = "vote",
}: VoterIdentityDialogProps) {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const trimmed = name.trim();
  const isDuplicate = existingNames.some(
    (n) => n.toLowerCase() === trimmed.toLowerCase()
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel?.()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>What&apos;s your name?</DialogTitle>
          <DialogDescription>
            {context === "comment"
              ? "Enter your name to leave a comment."
              : "Enter your name to participate. Each participant can only vote once."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="voter-name">Name</Label>
          <Input
            id="voter-name"
            placeholder="e.g. Alice"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && trimmed && !isDuplicate) {
                onSubmit(trimmed, comment.trim() || undefined);
              }
            }}
          />
          {isDuplicate && (
            <p className="text-sm text-destructive">
              Someone with that name has already voted.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="voter-comment">Leave a comment (optional)</Label>
          <Textarea
            id="voter-comment"
            placeholder="Share your thoughts on this choice..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button
            onClick={() => onSubmit(trimmed, comment.trim() || undefined)}
            disabled={!trimmed || isDuplicate}
          >
            <ArrowRight className="size-4" />
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
