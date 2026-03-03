"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Sparkles, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSessions } from "@/lib/design-store";
import { generateId } from "@/lib/design-utils";
import type { MediaType } from "@/lib/design-types";
import { OptionForm } from "@/components/design/option-form";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OptionDraft {
  key: string;
  title: string;
  description: string;
  mediaType: MediaType;
  mediaUrl: string;
  rationale: string;
}

function makeDefaultOption(): OptionDraft {
  return {
    key: generateId(),
    title: "",
    description: "",
    mediaType: "none",
    mediaUrl: "",
    rationale: "",
  };
}

export function CreateSessionDialog({ children }: { children: React.ReactNode }) {
  const { createSession } = useSessions();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1 — Basics
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [participantCount, setParticipantCount] = useState(2);

  // Step 2 — Brief
  const [problem, setProblem] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [constraints, setConstraints] = useState("");

  // Step 3 — Options
  const [options, setOptions] = useState<OptionDraft[]>([
    makeDefaultOption(),
    makeDefaultOption(),
  ]);

  function reset() {
    setStep(1);
    setTitle("");
    setDescription("");
    setPreviewUrl("");
    setParticipantCount(2);
    setProblem("");
    setGoal("");
    setAudience("");
    setConstraints("");
    setOptions([makeDefaultOption(), makeDefaultOption()]);
  }

  function addOption() {
    setOptions((prev) => [...prev, makeDefaultOption()]);
  }

  function removeOption(key: string) {
    setOptions((prev) => prev.filter((o) => o.key !== key));
  }

  function updateOption(key: string, field: keyof OptionDraft, value: string) {
    setOptions((prev) =>
      prev.map((o) => (o.key === key ? { ...o, [field]: value } : o))
    );
  }

  const filledOptions = options.filter((o) => o.title.trim());
  const canProceedStep1 = title.trim().length > 0;
  const canProceedStep3 = filledOptions.length >= 2;
  const canSubmit = canProceedStep1 && canProceedStep3 && participantCount >= 1 && !submitting;

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const session = await createSession(
        title.trim(),
        description.trim(),
        participantCount,
        filledOptions.map((o) => ({
          title: o.title.trim(),
          description: o.description.trim(),
          mediaType: o.mediaType,
          mediaUrl: o.mediaUrl.trim() || undefined,
          rationale: o.rationale.trim() || undefined,
        })),
        previewUrl.trim() || undefined,
        {
          problem: problem.trim() || undefined,
          goal: goal.trim() || undefined,
          audience: audience.trim() || undefined,
          constraints: constraints.trim() || undefined,
        }
      );
      toast.success(`Created "${session.title}"`);
      reset();
      setOpen(false);
      router.push(`/explorations/${session.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  }

  const stepTitles: Record<number, { title: string; description: string }> = {
    1: { title: "New Session", description: "Start with a title and basic settings." },
    2: { title: "Set Context", description: "Help voters understand what they're evaluating." },
    3: { title: "Design Options", description: "Add the options voters will choose between." },
    4: { title: "Review", description: "Confirm everything looks good." },
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setStep(1); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : s < step
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {s}
              </div>
            ))}
          </div>
          <DialogTitle>{stepTitles[step].title}</DialogTitle>
          <DialogDescription>{stepTitles[step].description}</DialogDescription>
        </DialogHeader>

        {/* Step content */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session-title">Title</Label>
              <Input
                id="session-title"
                placeholder="e.g. Homepage hero redesign"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session-desc">Description</Label>
              <Textarea
                id="session-desc"
                placeholder="Brief context for voters..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview-url">Preview URL (optional)</Label>
              <Input
                id="preview-url"
                type="url"
                placeholder="https://..."
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant-count">Number of voters</Label>
              <Input
                id="participant-count"
                type="number"
                min={1}
                max={50}
                value={participantCount}
                onChange={(e) =>
                  setParticipantCount(Math.max(1, parseInt(e.target.value) || 1))
                }
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brief-problem">Problem</Label>
              <Textarea
                id="brief-problem"
                placeholder="What problem does this solve? e.g. Current hero section has low engagement..."
                rows={2}
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brief-goal">Goal</Label>
              <Textarea
                id="brief-goal"
                placeholder="What's the desired outcome? e.g. Increase click-through rate to 5%..."
                rows={2}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brief-audience">Audience</Label>
              <Textarea
                id="brief-audience"
                placeholder="Who is this for? e.g. First-time visitors on mobile..."
                rows={2}
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="brief-constraints">Constraints</Label>
              <Textarea
                id="brief-constraints"
                placeholder="Any limitations? e.g. Must work with existing brand colors..."
                rows={2}
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Label>Options (min 2)</Label>
            {options.map((opt, i) => (
              <div key={opt.key} className="rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <OptionForm
                      value={opt}
                      onChange={(field, value) => updateOption(opt.key, field, value)}
                      titlePlaceholder={`Option ${i + 1} title`}
                    />
                  </div>
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="mt-1.5"
                      onClick={() => removeOption(opt.key)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption}>
              <Plus className="size-3.5" />
              Add option
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">{title}</p>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
              {previewUrl && (
                <p className="text-xs text-muted-foreground truncate">
                  Preview: {previewUrl}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {participantCount} voter{participantCount !== 1 ? "s" : ""}
              </p>
            </div>

            {(problem || goal || audience || constraints) && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Brief
                </p>
                {problem && (
                  <p className="text-sm">
                    <span className="font-medium">Problem:</span> {problem}
                  </p>
                )}
                {goal && (
                  <p className="text-sm">
                    <span className="font-medium">Goal:</span> {goal}
                  </p>
                )}
                {audience && (
                  <p className="text-sm">
                    <span className="font-medium">Audience:</span> {audience}
                  </p>
                )}
                {constraints && (
                  <p className="text-sm">
                    <span className="font-medium">Constraints:</span> {constraints}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Options ({filledOptions.length})
              </p>
              {filledOptions.map((opt, i) => (
                <div key={opt.key} className="rounded-lg border p-2.5 space-y-0.5">
                  <p className="text-sm font-medium">
                    {i + 1}. {opt.title}
                  </p>
                  {opt.description && (
                    <p className="text-sm text-muted-foreground">{opt.description}</p>
                  )}
                  {opt.rationale && (
                    <p className="text-xs text-muted-foreground">
                      Rationale: {opt.rationale}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
          {step < 4 && (
            <Button
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 3 && !canProceedStep3)
              }
              onClick={() => setStep(step + 1)}
            >
              Next
              <ArrowRight className="size-4" />
            </Button>
          )}
          {step === 4 && (
            <Button disabled={!canSubmit} onClick={handleSubmit}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Create Session
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
