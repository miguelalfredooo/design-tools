import Link from "next/link";
import { BellRing, Mail, MessageSquareQuote, Settings2 } from "lucide-react";
import { CreatorToolsLinkCard } from "@/components/design/creator-tools-link-card";
import { CreatorToolsLeadCard } from "@/components/design/creator-tools-lead-card";
import { CreatorToolsSectionPanel } from "@/components/design/creator-tools-section-panel";
import { CreatorToolsSimpleStatCard } from "@/components/design/creator-tools-simple-stat-card";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { CreatorToolsPageSurface } from "@/components/design/creator-tools-page-surface";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCreatorToolsPillClass } from "@/lib/creator-tools-pill";
import { experimentStats, nudgeInbox, nudgeKpis, nudgePreferences } from "@/lib/mock/creator-tools";

export default function CreatorToolsNudgesPage() {
  return (
    <CreatorToolsShell
      badge="Nudges"
      title="AI-Driven Engagement Nudges"
      description="The PRD feature area for well-timed creator prompts. These nudges help creators notice conversations worth joining, recover lapsed readers, and break through blank-page friction without becoming notification spam."
    >
      <FadeIn delay={0.05} className="w-full">
        <CreatorToolsPageSurface tone="gradient">
          <div className="border-b border-border/60 px-6 py-5 md:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <BellRing className="size-4 text-primary" />
                  Action suggestions
                </div>
                <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                  Timely Response Signals
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Nudges should feel like a trusted assistant, not a nagging system.
                  They are opt-in, configurable, and only valuable when the signal is
                  specific enough to drive an immediate creator decision.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="secondary"
                  className={`rounded-full px-3 py-1 ${getCreatorToolsPillClass("Daily digest default")}`}
                >
                  Daily digest default
                </Badge>
                <Badge
                  variant="outline"
                  className={`rounded-full px-3 py-1 ${getCreatorToolsPillClass("High-signal question")}`}
                >
                  Mock data
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4 md:p-8">
            {nudgeKpis.map((item) => (
              <CreatorToolsSimpleStatCard
                key={item.label}
                label={item.label}
                value={item.value}
                detail={item.detail}
              />
            ))}
          </div>

          <div className="grid gap-4 border-t border-border/60 bg-secondary/20 p-6 2xl:grid-cols-2 md:p-8">
            <CreatorToolsSectionPanel title="Nudge types" icon={MessageSquareQuote}>
              <div className="space-y-3">
                {nudgeInbox.map((item) => (
                  <CreatorToolsLinkCard
                    key={item.title}
                    href={item.href}
                    title={item.title}
                    description={item.body}
                    badge={item.type}
                    meta={item.priority}
                    footerLabel="View signal"
                  />
                ))}
              </div>
            </CreatorToolsSectionPanel>

            <div className="space-y-4">
              <CreatorToolsLeadCard
                eyebrow="Best nudge right now"
                title="Use the high-signal question digest as the first interruption worth sending."
                description="The goal is not to notify more. It is to interrupt only when the creator can immediately see why a response matters and what they should do next."
                details={
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Mail className="size-4" />
                      Creator opportunity digest
                    </div>
                    <p className="text-sm leading-6 text-primary-foreground/80">
                      1 high-signal question, 1 lapsed reader opportunity, and 1
                      conversation starter are ready for review. The product defaults
                      to daily digest and only escalates to real-time when the signal
                      is clearly worth interrupting for.
                    </p>
                  </div>
                }
                actions={
                  <>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/drops/creator-tools/nudges/high-signal-question">Open leading signal</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link href="/drops/creator-tools/controls/scheduler">Convert to scheduled post</Link>
                </Button>
                  </>
                }
              />

              <CreatorToolsSectionPanel title="Creator controls" icon={Settings2}>
                <div className="space-y-3">
                  {nudgePreferences.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-secondary/20 px-4 py-3">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-sm text-muted-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CreatorToolsSectionPanel>
            </div>
          </div>

          <div className="grid gap-4 border-t border-border/60 p-6 md:grid-cols-3 md:p-8">
            {experimentStats.map((item) => (
              <CreatorToolsSimpleStatCard
                key={item.label}
                label={item.label}
                value={item.value}
                detail={item.note}
              />
            ))}
          </div>
        </CreatorToolsPageSurface>
      </FadeIn>
    </CreatorToolsShell>
  );
}
