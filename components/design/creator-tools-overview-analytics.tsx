"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  MessageSquareQuote,
  Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";
import { SectionFeedback } from "@/components/design/section-feedback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  actionQueue,
  pageviewTrend,
  threadSignals,
  trafficSources,
} from "@/lib/mock/creator-tools";
import { creatorToolsFeedbackId } from "@/lib/mock/creator-tools-feedback";

const trendConfig = {
  pageviews: { label: "Pageviews", color: "#111827" },
  engaged: { label: "Engaged readers", color: "#f59e0b" },
};

const sourceConfig = {
  direct: { label: "Direct", color: "#111827" },
  notifications: { label: "Notifications", color: "#f59e0b" },
  search: { label: "Search", color: "#10b981" },
  email: { label: "Email", color: "#3b82f6" },
};

export function CreatorToolsOverviewAnalytics() {
  return (
    <div className="grid gap-4 border-t border-border/60 p-6 2xl:grid-cols-2 md:p-8">
      <div className="rounded-[28px] border border-border/60 bg-background/90 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Momentum Trend
            </p>
            <h3 className="mt-1 text-lg font-bold">Community Movement</h3>
          </div>
          <Badge variant="outline" className="rounded-full px-3 py-1">
            Readers returning
          </Badge>
        </div>

        <ChartContainer config={trendConfig} className="mt-6 h-[240px] w-full">
          <AreaChart data={pageviewTrend} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="fillPageviews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-pageviews)" stopOpacity={0.24} />
                <stop offset="95%" stopColor="var(--color-pageviews)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fillEngaged" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-engaged)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-engaged)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="pageviews" stroke="var(--color-pageviews)" fill="url(#fillPageviews)" strokeWidth={2.5} />
            <Area type="monotone" dataKey="engaged" stroke="var(--color-engaged)" fill="url(#fillEngaged)" strokeWidth={2} />
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="space-y-4">
        <div className="rounded-[28px] border border-border/60 bg-background/90 p-5">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Traffic source mix
            </p>
          </div>
          <ChartContainer config={sourceConfig} className="mt-4 h-[180px] w-full">
            <PieChart>
              <Pie data={trafficSources} dataKey="value" nameKey="name" innerRadius={42} outerRadius={68} strokeWidth={0}>
                {trafficSources.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
          <div className="mt-2 space-y-2">
            {trafficSources.map((source) => (
              <div key={source.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: source.fill }} />
                  <span>{source.name}</span>
                </div>
                <span className="font-medium">{source.value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-border/60 bg-background/90 p-5">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="size-4 text-primary" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Supporting context
            </p>
          </div>
          <div className="mt-4 space-y-3">
            {threadSignals.slice(0, 2).map((thread) => (
              <div
                key={thread.title}
                className="rounded-2xl border border-border/60 bg-secondary/25 p-4"
              >
                <Link href={thread.href} className="block transition-colors hover:text-foreground">
                  <p className="text-sm font-semibold">{thread.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{thread.body}</p>
                </Link>
                <SectionFeedback
                  page="overview"
                  targetType="thread"
                  targetId={creatorToolsFeedbackId("overview", "thread", thread.title)}
                  className="mt-4"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-border/60 pt-4">
            <div className="flex items-center gap-2">
              <BellRing className="size-4 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Priority actions
              </p>
            </div>
            <div className="mt-3 space-y-3">
              {actionQueue.slice(0, 2).map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-secondary/25 p-4"
                >
                  <Link href={item.href} className="block transition-colors hover:text-foreground">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.note}</p>
                  </Link>
                  <SectionFeedback
                    page="overview"
                    targetType="action"
                    targetId={creatorToolsFeedbackId("overview", "action", item.title)}
                    className="mt-4"
                  />
                </div>
              ))}
            </div>
            <Button asChild variant="ghost" className="mt-3 px-0">
              <Link href="/drops/creator-tools/actions">
                Open all actions
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
