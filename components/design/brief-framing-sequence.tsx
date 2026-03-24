import { ArrowRight, Crosshair, Lightbulb, Rocket, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Goal",
    detail: "What business or product outcome are we trying to move?",
    icon: Crosshair,
  },
  {
    title: "Problem / Opportunity",
    detail: "What specific friction, gap, or signal makes this worth solving?",
    icon: TriangleAlert,
  },
  {
    title: "Proposed Solution",
    detail: "What are we recommending only after the goal and problem are clear?",
    icon: Lightbulb,
  },
  {
    title: "Expected Outcome",
    detail: "What should change if the solution is correct?",
    icon: Rocket,
  },
];

export function BriefFramingSequence({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-muted/25 p-4",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        PRD / Brief framing
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Goal -&gt; problem/opportunity -&gt; proposed solution -&gt; expected outcome
      </p>
      <div
        className={cn(
          "mt-4 grid gap-3",
          compact ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 xl:grid-cols-4"
        )}
      >
        {steps.map(({ title, detail, icon: Icon }, index) => (
          <div
            key={title}
            className="rounded-xl border border-border/60 bg-background/85 p-3"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Icon className="size-4 text-primary" />
              <span>{title}</span>
              {index < steps.length - 1 ? (
                <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
              ) : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
