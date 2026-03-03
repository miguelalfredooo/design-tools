"use client";

import { useState } from "react";
import type { EffortLevel } from "@/lib/design-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VoteConfirmDialogProps {
  open: boolean;
  optionTitle: string;
  onConfirm: (comment: string, effort?: EffortLevel, impact?: EffortLevel) => void;
  onCancel: () => void;
}

export function VoteConfirmDialog({
  open,
  optionTitle,
  onConfirm,
  onCancel,
}: VoteConfirmDialogProps) {
  const [comment, setComment] = useState("");
  const [effort, setEffort] = useState<EffortLevel | "">("");
  const [impact, setImpact] = useState<EffortLevel | "">("");

  function handleCancel() {
    setComment("");
    setEffort("");
    setImpact("");
    onCancel();
  }

  function handleConfirm() {
    onConfirm(
      comment.trim(),
      effort || undefined,
      impact || undefined
    );
    setComment("");
    setEffort("");
    setImpact("");
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm your vote</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;re about to vote for <strong>{optionTitle}</strong>. This
            cannot be changed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Effort estimate</Label>
              <Select value={effort} onValueChange={(v) => setEffort(v as EffortLevel)}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Impact estimate</Label>
              <Select value={impact} onValueChange={(v) => setImpact(v as EffortLevel)}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            placeholder="What do you like about this? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            <X className="size-4" />
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            <Check className="size-4" />
            Cast Vote
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
