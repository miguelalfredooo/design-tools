import type { ComponentType } from "react";
import { Crosshair, Lightbulb, MessageSquare, ShieldCheck, Target, Users } from "lucide-react";

interface BriefArtifactField {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}

interface BriefArtifactProps {
  title?: string;
  description?: string;
  fields: BriefArtifactField[];
}

export function BriefArtifact({
  title = "Conversation artifact",
  description = "Use this brief to align on context before discussing scope, design, or implementation.",
  fields,
}: BriefArtifactProps) {
  return (
    <section className="rounded-[24px] border border-border/60 bg-card/85 p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-full border border-border/60 bg-muted/40 p-2">
          <MessageSquare className="size-4 text-primary" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-border/60 bg-background/85 p-4"
          >
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Icon className="size-3.5" />
              <span>{label}</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-foreground/90">{value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export const creatorToolsBriefFields = [
  {
    label: "Goal",
    value:
      "Increase creator engagement by giving creators a clearer path to post, manage, and respond inside Raptive Community without adding more operational overhead.",
    icon: Crosshair,
  },
  {
    label: "Problem / Opportunity",
    value:
      "Creators currently experience the community as a black box. They lack clear signal on what is resonating, which conversations need attention, and how to stay active without manual effort.",
    icon: Target,
  },
  {
    label: "Proposed Solution",
    value:
      "Ship a Creator Tools suite that combines post controls, opinionated analytics, and AI-assisted nudges so creators can understand signal, act faster, and stay consistently present.",
    icon: Lightbulb,
  },
  {
    label: "Expected Outcome",
    value:
      "Creators post more consistently, respond in higher-signal moments, and deepen audience connection. Raptive gains more creator activity, stronger session depth, and clearer product value.",
    icon: MessageSquare,
  },
  {
    label: "Audience",
    value:
      "Time-poor creators such as bloggers, journalists, and niche experts who already manage content across blogs, newsletters, and social channels.",
    icon: Users,
  },
  {
    label: "Constraints",
    value:
      "V1 should stay lightweight, opinionated, and trust-building. AI needs to be configurable, analytics must avoid vanity noise, and delegation must preserve creator authenticity.",
    icon: ShieldCheck,
  },
] satisfies BriefArtifactField[];
