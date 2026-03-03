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
import { ArrowRight } from "lucide-react";

interface VoterIdentityDialogProps {
  open: boolean;
  onSubmit: (name: string) => void;
  onCancel?: () => void;
  existingNames: string[];
}

export function VoterIdentityDialog({
  open,
  onSubmit,
  onCancel,
  existingNames,
}: VoterIdentityDialogProps) {
  const [name, setName] = useState("");
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
            Enter your name to cast your vote. Each participant can only vote
            once.
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
                onSubmit(trimmed);
              }
            }}
          />
          {isDuplicate && (
            <p className="text-sm text-destructive">
              Someone with that name has already voted.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => onSubmit(trimmed)}
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
