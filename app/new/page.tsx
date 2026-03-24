"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSessions } from "@/lib/design-store";
import { useAdmin } from "@/hooks/use-admin";
import { generateId } from "@/lib/design-utils";
import type { MediaType } from "@/lib/design-types";
import { Button } from "@/components/ui/button";
import { DraftOptionCard } from "@/components/design/draft-option-card";
import { LiveDraftHeaderFields } from "@/components/design/live-draft-header-fields";
import { SessionBriefInputs } from "@/components/design/session-brief-inputs";

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

export default function NewSessionPage() {
  const { createSession } = useSessions();
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Setup fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [participantCount, setParticipantCount] = useState(3);
  const [showBrief, setShowBrief] = useState(true);
  const [topic, setTopic] = useState("");
  const [hypothesis, setHypothesis] = useState("");
  const [problem, setProblem] = useState("");
  const [goal, setGoal] = useState("");
  const [audience, setAudience] = useState("");
  const [constraints, setConstraints] = useState("");

  // Options
  const [options, setOptions] = useState<OptionDraft[]>([
    makeDefaultOption(),
  ]);

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
  const canSubmit =
    (isAdmin || (title.trim().length > 0 && filledOptions.length >= 2)) &&
    !submitting;

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
      router.push(`/explorations/${session.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create session"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Home
          </Link>
        </Button>
      </div>

      {/* Header — editable title & description inline */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <LiveDraftHeaderFields
              titleId="new-session-title"
              descriptionId="new-session-description"
              titleLabel="Session title"
              descriptionLabel="Description"
              titlePlaceholder="Session title..."
              descriptionPlaceholder="Proposed solution or concept summary for voters..."
              titleValue={title}
              descriptionValue={description}
              onTitleChange={setTitle}
              onDescriptionChange={setDescription}
              descriptionRows={1}
              labelMode="sr-only"
              density="inline"
              emphasis="hero"
              autoFocus
            />
          </div>
        </div>

        {/* Context brief accordion */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowBrief(!showBrief)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Context Brief
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                showBrief && "rotate-180"
              )}
            />
          </button>
          {showBrief && (
            <div className="mt-5">
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
                fieldClassName="text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/30 w-full"
              />
            </div>
          )}
        </div>

      </div>

      {/* Preview URL */}
      <div className="mb-8">
        <input
          type="url"
          placeholder="Preview URL (optional) — https://..."
          value={previewUrl}
          onChange={(e) => setPreviewUrl(e.target.value)}
          className="text-sm text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/30 w-full"
        />
      </div>

      {/* Options grid — mirrors session detail layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {options.map((opt, i) => (
          <DraftOptionCard
            key={opt.key}
            value={opt}
            index={i}
            onChange={(field, value) => updateOption(opt.key, field, value)}
            onRemove={options.length > 1 ? () => removeOption(opt.key) : undefined}
          />
        ))}

        {/* Add option card */}
        <button
          onClick={addOption}
          className="rounded-xl border border-dashed bg-muted/30 p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors min-h-[120px]"
        >
          <Plus className="size-5" />
          <span className="text-sm font-medium">Add option</span>
        </button>
      </div>

      {/* Spacer for sticky bottom bar */}
      <div className="h-20" />

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="max-w-[800px] mx-auto pointer-events-auto">
          <div className="mx-3 md:mx-6 mb-3 md:mb-6 rounded-xl border bg-card shadow-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">Voters</span>
              <div className="flex items-center gap-0.5">
                {[2, 3, 4, 5, 6, 7].map((n) => (
                  <Button
                    key={n}
                    variant={participantCount === n ? "default" : "outline"}
                    size="icon-xs"
                    onClick={() => setParticipantCount(n)}
                    className="w-7 h-7 text-xs tabular-nums"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <Button disabled={!canSubmit} size="sm" onClick={handleSubmit} className="w-full sm:w-auto">
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
          </div>
        </div>
      </div>
    </div>
  );
}
