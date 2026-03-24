"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useSessions } from "@/lib/design-store";
import { useVoterIdentity } from "@/hooks/use-voter-identity";
import type { MediaType } from "@/lib/design-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { OptionForm, type OptionFormValues } from "@/components/design/option-form";
import { VoterIdentityDialog } from "@/components/design/voter-identity-dialog";

interface SuggestOptionDialogProps {
  sessionId: string;
}

export function SuggestOptionDialog({ sessionId }: SuggestOptionDialogProps) {
  const { suggestOption, session } = useSessions();
  const { name: voterName, setName: setVoterName } = useVoterIdentity();
  const [open, setOpen] = useState(false);
  const [showIdentity, setShowIdentity] = useState(false);
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

  function handleOpen() {
    if (!voterName) {
      setShowIdentity(true);
    } else {
      setOpen(true);
    }
  }

  async function handleSubmit() {
    if (!voterName) return;
    try {
      await suggestOption(
        sessionId,
        {
          title: form.title.trim(),
          description: form.description.trim(),
          mediaType: form.mediaType as MediaType,
          mediaUrl: form.mediaUrl.trim() || undefined,
          rationale: form.rationale.trim() || undefined,
        },
        voterName
      );
      toast.success(`Suggested "${form.title.trim()}"`);
      setForm({ title: "", description: "", mediaType: "none", mediaUrl: "", rationale: "" });
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to suggest option");
    }
  }

  return (
    <>
      <VoterIdentityDialog
        open={showIdentity}
        onSubmit={(name) => {
          setVoterName(name);
          setShowIdentity(false);
          setOpen(true);
        }}
        onCancel={() => setShowIdentity(false)}
        existingNames={session?.votes.map((v) => v.voterName) ?? []}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <button
          onClick={handleOpen}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer min-h-[200px]"
        >
          <Lightbulb className="size-8" />
          <span className="text-sm font-medium">Suggest an option</span>
        </button>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suggest an Option</DialogTitle>
            <DialogDescription>
              Propose a new design direction for the group to consider.
            </DialogDescription>
          </DialogHeader>
          <OptionForm
            value={form}
            onChange={handleChange}
            titlePlaceholder="e.g. Alternative approach — Minimal & Clean"
          />
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={!form.title.trim()}>
              <Lightbulb className="size-4" />
              Suggest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
