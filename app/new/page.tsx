"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSessions } from "@/lib/design-store";
import { useAdmin } from "@/hooks/use-admin";
import { generateId } from "@/lib/design-utils";
import type { MediaType } from "@/lib/design-types";
import { Button } from "@/components/ui/button";
import { DraftOptionCard } from "@/components/design/draft-option-card";

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
          problem: problem.trim() || undefined,
          goal: goal.trim() || undefined,
          audience: audience.trim() || undefined,
          constraints: constraints.trim() || undefined,
        }
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
            <input
              type="text"
              placeholder="Session title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="text-2xl font-bold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/40 w-full"
            />
            <textarea
              placeholder="Brief description for voters..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={1}
              className="text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/40 w-full resize-none text-base"
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
            <div className="grid gap-3 mt-8 grid-cols-1 sm:grid-cols-2 w-full">
              {[
                { key: "problem", label: "Problem", placeholder: "What problem does this solve?", value: problem, set: setProblem },
                { key: "goal", label: "Goal", placeholder: "What's the desired outcome?", value: goal, set: setGoal },
                { key: "audience", label: "Audience", placeholder: "Who is this for?", value: audience, set: setAudience },
                { key: "constraints", label: "Constraints", placeholder: "Any limitations?", value: constraints, set: setConstraints },
              ].map((field) => (
                <div key={field.key} className="space-y-1">
                  <div className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </div>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    className="text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/30 w-full"
                  />
                </div>
              ))}
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
