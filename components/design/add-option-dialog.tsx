"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSessions } from "@/lib/design-store";
import type { MediaType } from "@/lib/design-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { OptionForm, type OptionFormValues } from "@/components/design/option-form";

interface AddOptionDialogProps {
  sessionId: string;
  children: React.ReactNode;
}

export function AddOptionDialog({ sessionId, children }: AddOptionDialogProps) {
  const { addOption } = useSessions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<OptionFormValues>({
    title: "",
    description: "",
    mediaType: "none",
    mediaUrl: "",
    rationale: "",
  });

  function handleChange(field: keyof OptionFormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    try {
      await addOption(sessionId, {
        title: form.title.trim(),
        description: form.description.trim(),
        mediaType: form.mediaType as MediaType,
        mediaUrl: form.mediaUrl.trim() || undefined,
        rationale: form.rationale.trim() || undefined,
      });
      toast.success(`Added "${form.title.trim()}"`);
      setForm({ title: "", description: "", mediaType: "none", mediaUrl: "", rationale: "" });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add option");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Option</DialogTitle>
          <DialogDescription>
            Add a new design direction to vote on.
          </DialogDescription>
        </DialogHeader>
        <OptionForm
          value={form}
          onChange={handleChange}
          titlePlaceholder="e.g. Direction A — Bold & Modern"
        />
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!form.title.trim()}>
            <Plus className="size-4" />
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
