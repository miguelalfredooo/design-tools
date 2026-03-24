import Link from "next/link";
import { CalendarClock, Pin, ShieldCheck, Users } from "lucide-react";
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
import {
  controlsKpis,
  moderationActions,
  pinnedPosts,
  postingCalendar,
  scheduledPosts,
} from "@/lib/mock/creator-tools";

export default function CreatorToolsControlsPage() {
  return (
    <CreatorToolsShell
      badge="Controls"
      title="Post & Community Controls"
      description="Scheduling, pinning, moderation, and delegated publishing for creators and their teams. This is the PRD feature area focused on reducing friction and giving creators more control over presence."
    >
      <FadeIn delay={0.05} className="w-full">
        <CreatorToolsPageSurface tone="gradient">
          <div className="border-b border-border/60 px-6 py-5 md:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <CalendarClock className="size-4 text-primary" />
                  Execution tools
                </div>
                <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                  Operational Controls
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  The first product priority is consistency. These controls make it
                  easier to post ahead of time, keep important content visible, and
                  let trusted team members support the creator without eroding reader
                  trust.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="secondary"
                  className={`rounded-full px-3 py-1 ${getCreatorToolsPillClass("P0 focus")}`}
                >
                  P0 focus
                </Badge>
                <Badge
                  variant="outline"
                  className={`rounded-full px-3 py-1 ${getCreatorToolsPillClass("Control")}`}
                >
                  Static clickthrough
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4 md:p-8">
            {controlsKpis.map((item) => (
              <CreatorToolsSimpleStatCard
                key={item.label}
                label={item.label}
                value={item.value}
                detail={item.detail}
              />
            ))}
          </div>

          <div className="grid gap-4 border-t border-border/60 bg-secondary/20 p-6 2xl:grid-cols-2 md:p-8">
            <CreatorToolsLeadCard
              eyebrow="Main control principle"
              title="Reduce friction, but keep trust visible."
              description="Scheduling and delegation only help if they let the creator stay present without making the community feel automated or misleading."
              details={
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Preview metadata</p>
                  <p className="text-sm text-primary-foreground/80">
                    By Miguel Arias • Posted by Team • Scheduled for Thu at 9:00 AM
                  </p>
                </div>
              }
              actions={
                <>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/drops/creator-tools/controls/team-review">Review team draft</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  <Link href="/drops/creator-tools/controls/scheduler">Open scheduling</Link>
                </Button>
                </>
              }
            />

            <CreatorToolsSectionPanel title="Publishing queue" icon={CalendarClock}>
              <div className="space-y-3">
                {scheduledPosts.map((post) => (
                  <div key={post.title} className="rounded-2xl border border-border/60 bg-secondary/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CreatorToolsLinkCard
                        href={post.href}
                        title={post.title}
                        description={`${post.publishAt} • ${post.source}`}
                        className="flex-1 border-0 bg-transparent p-0 hover:bg-transparent hover:border-transparent"
                      />
                      <Badge
                        variant="outline"
                        className={`rounded-full px-3 py-1 ${getCreatorToolsPillClass(
                          post.status
                        )}`}
                      >
                        {post.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CreatorToolsSectionPanel>
          </div>

          <div className="grid gap-4 border-t border-border/60 p-6 xl:grid-cols-2 2xl:grid-cols-3 md:p-8">
            <CreatorToolsSectionPanel title="Pinning" icon={Pin}>
              <div className="space-y-3">
                {pinnedPosts.map((post) => (
                  <CreatorToolsLinkCard
                    key={post.title}
                    href="/drops/creator-tools/controls/pins"
                    title={post.title}
                    description={post.note}
                  />
                ))}
              </div>
            </CreatorToolsSectionPanel>

            <CreatorToolsSectionPanel title="Post management" icon={ShieldCheck}>
              <div className="space-y-3">
                {moderationActions.map((action) => (
                  <CreatorToolsLinkCard
                    key={action.title}
                    href={action.href}
                    title={action.title}
                    description={action.note}
                  />
                ))}
              </div>
            </CreatorToolsSectionPanel>

            <CreatorToolsSectionPanel title="Scheduling coverage" icon={Users}>
              <div className="grid gap-3 sm:grid-cols-2">
                {postingCalendar.map((item) => (
                  <div
                    key={item.day}
                    className={`rounded-2xl border p-4 ${
                      item.emphasis
                        ? "border-primary/30 bg-primary/8"
                        : "border-border/60 bg-secondary/20"
                    }`}
                  >
                    <p className="text-sm font-semibold">{item.day}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.slot}</p>
                  </div>
                ))}
              </div>
            </CreatorToolsSectionPanel>
          </div>
        </CreatorToolsPageSurface>
      </FadeIn>
    </CreatorToolsShell>
  );
}
