"use client";

import Link from "next/link";
import {
  ArrowRight,
  FileText,
  Layers3,
  MessageSquareQuote,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  creatorToolsModules,
  creatorToolsSupportingSurfaces,
} from "@/lib/mock/creator-tools";
import { getCreatorToolsPillClass } from "@/lib/creator-tools-pill";

const moduleIcons = {
  "What's Working": TrendingUp,
  "Show Up Now": MessageSquareQuote,
  "Next Steps": Zap,
} as const;

export function CreatorToolsOverviewMap() {
  return (
    <section className="grid gap-4 2xl:grid-cols-2">
      <div className="rounded-[28px] border border-border/60 bg-primary/95 p-5 text-primary-foreground">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary-foreground/75">
            <FileText className="size-4" />
            Context
          </div>
          <h3 className="mt-2 text-2xl font-black tracking-tight">PRD / Brief</h3>
          <p className="mt-3 text-sm leading-6 text-primary-foreground/80">
            Keep the PRD separate so it anchors the conversation when you need it,
            but doesn&apos;t slow creators down when they just want the next answer.
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-4">
            <Link href="/drops/creator-tools/prd">
              Open PRD / Brief
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-5 border-t border-white/12 pt-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/65">
            More context
          </p>
          <div className="mt-4 space-y-3">
            {creatorToolsSupportingSurfaces.map((surface) => (
              <Link
                key={surface.href}
                href={surface.href}
                className="block rounded-2xl border border-white/10 bg-black/10 p-4 transition-colors hover:bg-white/8"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{surface.title}</p>
                  <ArrowRight className="size-4 text-primary-foreground/65" />
                </div>
                <p className="mt-2 text-sm leading-6 text-primary-foreground/78">
                  {surface.summary}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-border/60 bg-card/85 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Layers3 className="size-4 text-primary" />
          Start here
        </div>
        <h2 className="mt-2 text-2xl font-black tracking-tight">
          Three things creators need fast
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Don&apos;t make creators parse the whole system. Start by showing what is
          working, where they should show up, and what action is worth taking next.
        </p>

        <div className="mt-5 space-y-3">
          {creatorToolsModules.map((module) => {
            const Icon = moduleIcons[module.title as keyof typeof moduleIcons] ?? Layers3;

            return (
              <Link
                key={module.href}
                href={module.href}
                className="group flex flex-col gap-4 rounded-[24px] border border-border/60 bg-background/85 p-5 transition-colors hover:border-primary/30 hover:bg-secondary/20"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex size-14 shrink-0 items-center justify-center self-start rounded-full border border-border/60 bg-secondary/30">
                    <Icon className="size-6 text-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xl font-black tracking-tight">{module.title}</p>
                      <span
                        className={`rounded-full border px-3 py-1 text-2xs font-semibold uppercase tracking-[0.16em] ${getCreatorToolsPillClass(
                          module.status
                        )}`}
                      >
                        {module.status}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-bold leading-7 tracking-tight text-foreground">
                      {module.insight}
                    </p>
                    <div className="mt-3 rounded-2xl border border-border/60 bg-secondary/25 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        {module.spotlightLabel}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                        {module.spotlightValue}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {module.supporting}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-4 text-sm">
                  <span className="font-semibold text-muted-foreground">
                    {module.status} path
                  </span>
                  <span className="inline-flex items-center gap-2 font-semibold text-foreground shrink-0">
                    {module.ctaLabel}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
