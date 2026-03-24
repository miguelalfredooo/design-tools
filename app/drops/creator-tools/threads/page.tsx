import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  MessageSquareQuote,
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
import { threadSignals, topPosts } from "@/lib/mock/creator-tools";
import { creatorToolsFeedbackId } from "@/lib/mock/creator-tools-feedback";

const threadSignalIcons = {
  "High-signal question cluster": AlertCircle,
  "Audience reactivation": Users,
  "Pinning opportunity": TrendingUp,
} as const;

export default function CreatorToolsThreadsPage() {
  return (
    <CreatorToolsShell
      badge="Threads"
      title="Conversation Signals"
      description="The posts, replies, and discussion clusters that prove whether a creator should show up right now."
    >
      <CreatorToolsPageSurface>
        <div className="border-b border-border/60 px-6 py-5 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MessageSquareQuote className="size-4 text-primary" />
                Evidence layer
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                Supporting Evidence
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Threads are where signal becomes a real participation decision. This
                view helps the team separate broad momentum from the specific
                conversations that are actually worth a creator response.
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/drops/creator-tools/actions">
                View Priority Actions
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 p-6 2xl:grid-cols-2 md:p-8">
          <div className="rounded-[28px] border border-border/60 bg-background/90 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Breakout conversations
            </p>
            <div className="mt-4 space-y-3">
              {threadSignals.map((thread) => {
                const ThreadIcon =
                  threadSignalIcons[thread.signal as keyof typeof threadSignalIcons] ??
                  MessageSquareQuote;

                return (
                  <div
                    key={thread.title}
                    className="rounded-2xl border border-border/60 bg-secondary/25 p-4"
                  >
                    <Link href={thread.href} className="block transition-colors hover:text-foreground">
                      <CreatorToolsInsightBlock
                        badge={thread.signal}
                        icon={ThreadIcon}
                        insight={thread.body}
                        supportingLabel="Supporting thread"
                        supportingText={thread.title}
                      />
                    </Link>
                    <SectionFeedback
                      page="threads"
                      targetType="thread"
                      targetId={creatorToolsFeedbackId("threads", "thread", thread.title)}
                      className="mt-4"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-border/60 bg-background/90 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Leading threads
            </p>
            <div className="mt-4 space-y-3">
              {topPosts.map((post, index) => (
                <div
                  key={post.title}
                  className="rounded-2xl border border-border/60 bg-secondary/25 p-4"
                >
                  <Link href={post.href} className="block transition-colors hover:text-foreground">
                    <div className="flex items-start gap-3">
                      <CreatorToolsRankBadge rank={index + 1} className="mt-0.5 shrink-0" />
                      <p className="pt-0.5 text-sm font-semibold leading-6">{post.title}</p>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <CreatorToolsMetricCard
                        label="Views"
                        value={post.views.toLocaleString()}
                        tone="Performance"
                      />
                      <CreatorToolsMetricCard
                        label="Engagement"
                        value={`${post.engagement}%`}
                        tone="Participation"
                      />
                    </div>
                  </Link>
                  <SectionFeedback
                    page="threads"
                    targetType="thread"
                    targetId={creatorToolsFeedbackId("threads", "thread", post.title)}
                    className="mt-4"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CreatorToolsPageSurface>
    </CreatorToolsShell>
  );
}
