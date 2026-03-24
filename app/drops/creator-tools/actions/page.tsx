import type { ComponentType } from "react";
import Link from "next/link";
import { BellRing, CalendarClock, Pin, ShieldCheck } from "lucide-react";
import { CreatorToolsLinkCard } from "@/components/design/creator-tools-link-card";
import { CreatorToolsLeadCard } from "@/components/design/creator-tools-lead-card";
import { CreatorToolsSectionPanel } from "@/components/design/creator-tools-section-panel";
import { CreatorToolsShell } from "@/components/design/creator-tools-shell";
import { CreatorToolsPageSurface } from "@/components/design/creator-tools-page-surface";
import { SectionFeedback } from "@/components/design/section-feedback";
import { Button } from "@/components/ui/button";
import {
  actionQueue,
  moderationActions,
  nudgeInbox,
  pinnedPosts,
  scheduledPosts,
} from "@/lib/mock/creator-tools";
import { creatorToolsFeedbackId } from "@/lib/mock/creator-tools-feedback";

export default function CreatorToolsActionsPage() {
  return (
    <CreatorToolsShell
      badge="Actions"
      title="Priority Actions"
      description="The decision layer that turns performance signal, audience behavior, and conversation context into the next useful creator move."
    >
      <CreatorToolsPageSurface>
        <div className="border-b border-border/60 px-6 py-5 md:px-8">
          <div className="flex items-start gap-2 text-sm font-semibold text-muted-foreground">
            <BellRing className="size-4 text-primary" />
            Action layer
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
            Recommended Moves
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This surface answers the product question behind the PRD: what should the
            creator do next? Every recommendation is tied to a capability area in V1,
            whether that means posting control, performance understanding, or an
            engagement prompt.
          </p>
        </div>

        <div className="grid gap-4 p-6 2xl:grid-cols-2 md:p-8">
          <div className="space-y-4">
            <CreatorToolsLeadCard
              eyebrow="Recommended move now"
              title="Reply in the meal prep thread, then schedule the follow-up template post."
              description="This is the clearest path from signal to outcome right now: answer the active questions while the conversation is still compounding, then lock in the next post while attention is high."
              details={
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Why this move leads</p>
                  <p className="text-sm leading-6 text-primary-foreground/80">
                    The strongest theme, the highest-value thread, and the best posting window all point to the same next step. That alignment is what makes this recommendation stronger than a generic task list.
                  </p>
                </div>
              }
              actions={
                <>
                <Button asChild size="sm" variant="secondary">
                  <Link href="/drops/creator-tools/nudges/high-signal-question">
                    Open response opportunity
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/drops/creator-tools/controls/scheduler">Open publishing controls</Link>
                </Button>
                </>
              }
            />

            <CreatorToolsSectionPanel title="Signals behind this recommendation">
              <div className="space-y-3">
              {nudgeInbox.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-border/60 bg-secondary/25 p-4"
                  >
                    <CreatorToolsLinkCard
                      href={item.href}
                      title={item.title}
                      description={item.body}
                      badge={item.type}
                      meta={item.priority}
                    />
                    <SectionFeedback
                      page="actions"
                      targetType="action"
                      targetId={creatorToolsFeedbackId("actions", "action", item.title)}
                      className="mt-4"
                    />
                  </div>
                ))}
              </div>
            </CreatorToolsSectionPanel>
          </div>

          <CreatorToolsSectionPanel title="Priority action queue">
            <div className="space-y-3">
              {actionQueue.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-secondary/25 p-4"
                >
                  <Link href={item.href} className="block transition-colors hover:text-foreground">
                    <p className="text-base font-bold leading-7 tracking-tight">{item.title}</p>
                    <div className="mt-3 rounded-2xl border border-border/60 bg-background/90 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Why this is worth doing
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground/90">{item.note}</p>
                    </div>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      {item.source}
                    </p>
                  </Link>
                  <SectionFeedback
                    page="actions"
                    targetType="action"
                    targetId={creatorToolsFeedbackId("actions", "action", item.title)}
                    className="mt-4"
                  />
                </div>
              ))}
            </div>
          </CreatorToolsSectionPanel>
        </div>

        <div className="grid gap-4 border-t border-border/60 p-6 xl:grid-cols-3 md:p-8">
          <ActionPanel
            icon={CalendarClock}
            title="Post consistency"
            items={scheduledPosts.map((post) => ({
              title: post.title,
              detail: `${post.publishAt} • ${post.source}`,
              href: post.href,
            }))}
          />
          <ActionPanel
            icon={Pin}
            title="Discoverability control"
            items={pinnedPosts.map((post) => ({
              title: post.title,
              detail: post.note,
              href: "/drops/creator-tools/controls/pins",
            }))}
          />
          <ActionPanel
            icon={ShieldCheck}
            title="Trust & delegation"
            items={moderationActions.map((action) => ({
              title: action.title,
              detail: action.note,
              href: action.href,
            }))}
          />
        </div>
      </CreatorToolsPageSurface>
    </CreatorToolsShell>
  );
}

function ActionPanel({
  icon: Icon,
  title,
  items,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  items: { title: string; detail: string; href: string }[];
}) {
  return (
    <CreatorToolsSectionPanel title={title} icon={Icon}>
      <div className="space-y-3">
        {items.map((item) => (
          <CreatorToolsLinkCard
            key={item.title}
            href={item.href}
            title={item.title}
            description={item.detail}
            className="hover:bg-secondary/40"
          />
        ))}
      </div>
    </CreatorToolsSectionPanel>
  );
}
