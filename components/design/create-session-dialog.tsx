"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Sparkles, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSessions } from "@/lib/design-store";
import { useAdmin } from "@/hooks/use-admin";
import { generateId } from "@/lib/design-utils";
import type { MediaType } from "@/lib/design-types";
import { OptionForm } from "@/components/design/option-form";
import { LiveDraftHeaderFields } from "@/components/design/live-draft-header-fields";
import { SessionBriefInputs } from "@/components/design/session-brief-inputs";
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
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // Step 1 — Setup
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [participantCount, setParticipantCount] = useState(3);
  const [showBrief, setShowBrief] = useState(false);
  const [topic, setTopic] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [problem, setProblem] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [constraints, setConstraints] = useState("");

  // Step 2 — Options
  const [options, setOptions] = useState<OptionDraft[]>([
    makeDefaultOption(),
    makeDefaultOption(),
  ]);

  function reset() {
    setStep(1);
    setTitle("");
    setDescription("");
    setPreviewUrl("");
    setParticipantCount(3);
    setShowBrief(false);
    setTopic("");
    setHypothesis("");
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
  const canProceed = isAdmin || title.trim().length > 0;
  const canSubmit = (isAdmin || (canProceed && filledOptions.length >= 2)) && !submitting;

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
          topic: topic.trim() || undefined,
          hypothesis: hypothesis.trim() || undefined,
          problem: problem.trim() || undefined,
          goal: goal.trim() || undefined,
          audience: audience.trim() || undefined,
          constraints: constraints.trim() || undefined,
        },
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

  const steps = [
    { num: 1, label: "Setup" },
    { num: 2, label: "Options" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setStep(1); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-1">
            {steps.map((s, i) => (
              <div key={s.num} className="flex items-center gap-3">
                {i > 0 && <div className="w-8 h-px bg-border" />}
                <button
                  onClick={() => {
                    if (s.num < step || (s.num === 2 && canProceed)) setStep(s.num);
                  }}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors",
                    s.num === step
                      ? "text-foreground"
                      : s.num < step
                        ? "text-primary cursor-pointer"
                        : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex size-6 items-center justify-center rounded-md text-xs font-semibold transition-colors",
                      s.num === step
                        ? "bg-primary text-primary-foreground"
                        : s.num < step
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {s.num}
                  </div>
                  {s.label}
                </button>
              </div>
            ))}
          </div>
          <DialogTitle className="sr-only">
            {step === 1 ? "New Session" : "Design Options"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {step === 1 ? "Set up your exploration session." : "Add design options for voters."}
          </DialogDescription>
        </DialogHeader>

        {/* ── Step 1: Setup ──────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <LiveDraftHeaderFields
              titleId="session-title"
              descriptionId="session-desc"
              titleLabel="What are you exploring?"
              descriptionLabel="Description"
              titlePlaceholder="e.g. Homepage hero redesign"
              descriptionPlaceholder="Proposed solution or concept summary for voters..."
              titleValue={title}
              descriptionValue={description}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              density="form"
              autoFocus
            />

            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label>Voters</Label>
                <div className="flex gap-1.5">
                  {[2, 3, 4, 5, 6, 7].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant={participantCount === n ? "default" : "outline"}
                      className="flex-1 h-8 text-xs"
                      onClick={() => setParticipantCount(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preview-url">Preview URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="preview-url"
                type="url"
                placeholder="https://..."
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
              />
            </div>

            {/* Collapsible brief section */}
            <div>
              <button
                type="button"
                onClick={() => setShowBrief(!showBrief)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <ChevronDown className={cn("size-3.5 transition-transform", !showBrief && "-rotate-90")} />
                <span className="font-medium">Design brief</span>
                <span className="text-xs">(optional)</span>
              </button>

              {showBrief && (
                <div className="space-y-3 mt-3 pl-5 border-l-2 border-border">
                  <SessionBriefInputs
                    topic={topic}
                    hypothesis={hypothesis}
                    goal={goal}
                    problem={problem}
                    audience={audience}
                    constraints={constraints}
                    onTopicChange={setTopic}
                    onHypothesisChange={setHypothesis}
                    onGoalChange={setGoal}
                    onProblemChange={setProblem}
                    onAudienceChange={setAudience}
                    onConstraintsChange={setConstraints}
                    useTextarea
                  />
                </div>
              )}
            </div>

          </div>
        )}

        {/* ── Step 2: Options ────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add the design options voters will choose between.
            </p>
            {options.map((opt, i) => (
              <div key={opt.key} className="rounded-lg border p-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-muted-foreground mt-2.5 w-4 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <OptionForm
                      value={opt}
                      onChange={(field, value) => updateOption(opt.key, field, value)}
                      titlePlaceholder={`Option ${i + 1} title`}
                    />
                  </div>
                  {options.length > 1 && (
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
            <div className="flex justify-center rounded-lg border border-dashed p-2">
              <Button variant="ghost" size="sm" onClick={addOption}>
                <Plus className="size-3.5" />
                Add option
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <Button disabled={!canProceed} onClick={() => setStep(2)}>
              Add Options
              <ArrowRight className="size-4" />
            </Button>
          )}
          {step === 2 && (
            <div className="flex items-center gap-2 w-full">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {filledOptions.length} option{filledOptions.length !== 1 ? "s" : ""}
              </span>
              <Button disabled={!canSubmit} onClick={handleSubmit}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Create
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
