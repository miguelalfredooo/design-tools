"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Flag, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  creatorToolsPrdHighlights,
  creatorToolsRolloutNotes,
  creatorToolsSuccessMetrics,
  creatorToolsV1Pillars,
} from "@/lib/mock/creator-tools";

export function CreatorToolsOverviewSignal() {
  return (
    <>
      <div className="border-b border-border/60 px-6 py-5 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <BriefcaseBusiness className="size-4 text-primary" />
              Product framing
            </div>
            <h2 className="text-2xl font-black tracking-tight md:text-3xl">
              Less guesswork, more useful next steps
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Creator Tools should reduce friction, clarify what is working, and
              make the next useful move obvious. If the product feels like a report,
              creators will drop.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/drops/creator-tools/prd">
                Open PRD / Brief
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 border-b border-border/60 bg-secondary/20 p-6 md:grid-cols-3 md:p-8">
        {creatorToolsPrdHighlights.map((item) => (
          <section
            key={item.title}
            className="rounded-[24px] border border-border/60 bg-background/90 p-5"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Creator need
            </p>
            <h3 className="mt-2 text-lg font-black tracking-tight">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {item.body}
            </p>
          </section>
        ))}
      </div>

      <div className="grid gap-4 border-b border-border/60 bg-secondary/10 p-6 2xl:grid-cols-2 md:p-8">
        <section className="space-y-4">
          <div className="rounded-[28px] border border-border/60 bg-primary/95 p-5 text-primary-foreground">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-foreground/75">
              <Target className="size-4" />
              Success at a glance
            </div>
            <div className="mt-4 space-y-3">
              {creatorToolsSuccessMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-black/10 p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground/65">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-xl font-black tracking-tight">
                    {metric.target}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-border/60 bg-background/90 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Rollout
            </p>
            <div className="mt-3 space-y-2">
              {creatorToolsRolloutNotes.map((note) => (
                <p key={note} className="text-sm leading-6 text-muted-foreground">
                  {note}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-border/60 bg-background/90 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Flag className="size-4 text-primary" />
            Quick read
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            {creatorToolsV1Pillars.map((pillar) => (
              <Link
                key={pillar.title}
                href={pillar.href}
                className="block rounded-[22px] border border-border/60 bg-secondary/20 p-4 transition-colors hover:bg-secondary/35"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-black tracking-tight">{pillar.title}</h3>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {pillar.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
