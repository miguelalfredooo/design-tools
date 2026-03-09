"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { ExplorationOption } from "@/lib/design-types";
import type { MediaType } from "@/lib/design-types";
import { useSessions } from "@/lib/design-store";
import { OptionForm, type OptionFormValues } from "@/components/design/option-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EditOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  option: ExplorationOption;
}

export function EditOptionDialog({ open, onOpenChange, sessionId, option }: EditOptionDialogProps) {
  const { updateOption } = useSessions();
  const [submitting, setSubmitting] = useState(false);
  const [values, setValues] = useState<OptionFormValues>({
    title: option.title,
    description: option.description,
    mediaType: option.mediaType,
    mediaUrl: option.mediaUrl ?? "",
    rationale: option.rationale ?? "",
  });

  function handleChange(field: keyof OptionFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      await updateOption(sessionId, option.id, {
        title: values.title,
        description: values.description,
        mediaType: values.mediaType as MediaType,
        mediaUrl: values.mediaUrl,
      });
      toast.success("Option updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Option</DialogTitle>
        </DialogHeader>
        <OptionForm
          value={values}
          onChange={handleChange}
          titlePlaceholder="Option title"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={submitting} onClick={handleSave}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
