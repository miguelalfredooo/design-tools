import Link from "next/link";
import { ArrowRight, RotateCcw, Users, Waves, Zap } from "lucide-react";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { CreatorToolsPageSurface } from "@/components/design/creator-tools-page-surface";
import { CreatorToolsInsightBlock } from "@/components/design/creator-tools-insight-block";
import { CreatorToolsMetricCard } from "@/components/design/creator-tools-metric-card";
import { SectionFeedback } from "@/components/design/section-feedback";
import { Button } from "@/components/ui/button";
import { audienceSegments } from "@/lib/mock/creator-tools";
import { creatorToolsFeedbackId } from "@/lib/mock/creator-tools-feedback";

const segmentIcons = {
  "Highly engaged regulars": Zap,
  "Reactivated readers": RotateCcw,
  "Caregiver planners": Users,
  "High-signal question askers": Waves,
} as const;

export default function CreatorToolsAudiencePage() {
  return (
    <CreatorToolsShell
      badge="Audience"
      title="Audience Signals"
      description="The reader groups that are deepening conversation, returning after inactivity, or showing early signs of drift."
    >
      <CreatorToolsPageSurface>
        <div className="border-b border-border/60 px-6 py-5 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Users className="size-4 text-primary" />
                Audience lens
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                Audience Shifts
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Audience segments turn broad theme momentum into concrete people and
                behaviors. This is how the prototype connects performance insight to
                retention risk and creator opportunity.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/drops/creator-tools/threads">
                View Conversation Signals
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
          {audienceSegments.map((segment) => {
            const SegmentIcon =
              segmentIcons[segment.label as keyof typeof segmentIcons] ?? Users;

            return (
              <div
                key={segment.label}
                className="rounded-[28px] border border-border/60 bg-background/90 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <CreatorToolsInsightBlock
                    badge={segment.signal}
                    icon={SegmentIcon}
                    insight={segment.summary}
                    supportingLabel="Audience segment"
                    supportingText={segment.label}
                  />
                  <CreatorToolsMetricCard
                    label="Segment size"
                    value={segment.size}
                    tone={segment.signal}
                    align="right"
                    className="shrink-0 lg:min-w-[132px]"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Best use of this signal
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/90">
                    Use this segment to decide whether the next move should deepen the
                    current theme, recover quieter readers, or answer a high-leverage
                    question right away.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <Link
                    href={segment.relatedThreadHref}
                    className="inline-flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    View supporting thread
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href={segment.relatedThemeHref}
                    className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Theme signal: {segment.relatedTheme}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              <SectionFeedback
                page="audience"
                targetType="audience_segment"
                targetId={creatorToolsFeedbackId("audience", "audience_segment", segment.label)}
                className="mt-4"
              />
              </div>
            );
          })}
        </div>
      </CreatorToolsPageSurface>
    </CreatorToolsShell>
  );
}
