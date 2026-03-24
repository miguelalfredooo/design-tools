import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Coins,
  Refrigerator,
  TrendingUp,
  Users,
} from "lucide-react";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { CreatorToolsPageSurface } from "@/components/design/creator-tools-page-surface";
import { CreatorToolsInsightBlock } from "@/components/design/creator-tools-insight-block";
import { CreatorToolsMetricCard } from "@/components/design/creator-tools-metric-card";
import { CreatorToolsRankBadge } from "@/components/design/creator-tools-rank-badge";
import { SectionFeedback } from "@/components/design/section-feedback";
import { Button } from "@/components/ui/button";
import { themes } from "@/lib/mock/creator-tools";
import { creatorToolsFeedbackId } from "@/lib/mock/creator-tools-feedback";

const themeIcons = {
  "Meal prep systems": Refrigerator,
  "Budget shortcuts": Coins,
  "Family routine hacks": Users,
  "Pantry resets": Briefcase,
} as const;

export default function CreatorToolsThemesPage() {
  return (
    <CreatorToolsShell
      badge="Themes"
      title="Theme Momentum"
      description="The broad content patterns that help explain what is resonating before the team drills into audience segments, threads, and creator action."
    >
      <CreatorToolsPageSurface>
        <div className="border-b border-border/60 px-6 py-5 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <TrendingUp className="size-4 text-primary" />
                Theme momentum
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                Leading Themes
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This is the top of the performance-understanding layer. Themes show
                which content patterns are driving engagement and pageview potential,
                so the team can decide what deserves more creator attention.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/drops/creator-tools/audience">
                View Audience Signals
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="space-y-3 p-6 md:p-8">
          {themes.map((item, index) => {
            const ThemeIcon =
              themeIcons[item.theme as keyof typeof themeIcons] ?? TrendingUp;

            return (
              <div
                key={item.theme}
                className="rounded-[24px] border border-border/60 bg-background/90 p-4 md:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CreatorToolsRankBadge rank={index + 1} />
                    </div>
                    <div className="mt-3">
                      <CreatorToolsInsightBlock
                        badge={item.status}
                        icon={ThemeIcon}
                        insight={item.summary}
                        supportingLabel="Theme"
                        supportingText={`${item.theme} • Best for ${item.relatedAudience}`}
                      />
                    </div>
                  </div>

                  <div className="lg:min-w-[132px] lg:pl-4">
                    <CreatorToolsMetricCard
                      label="Theme score"
                      value={item.momentum}
                      tone={item.status}
                      align="right"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <Link
                    href={item.relatedThreadHref}
                    className="inline-flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    Open conversation
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href={item.relatedAudienceHref}
                    className="inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Audience context
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
                <SectionFeedback
                  page="themes"
                  targetType="theme"
                  targetId={creatorToolsFeedbackId("themes", "theme", item.theme)}
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
