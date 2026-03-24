"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FlaskConical,
  Lightbulb,
  Loader2,
  Pencil,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/design/research/stat-card";
import { useAdmin } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";
import type { DashboardData, TopItem } from "@/lib/research-dashboard-types";
import { BUCKET_LABELS, type Bucket } from "@/lib/research-hub-types";

const BUCKETS: Bucket[] = ["needs", "pain_points", "opportunities", "actionable_insights"];

const BUCKET_ICONS: Record<Bucket, typeof Target> = {
  needs: Target,
  pain_points: AlertTriangle,
  opportunities: Lightbulb,
  actionable_insights: Zap,
};

const BUCKET_COLORS: Record<Bucket, string> = {
  needs: "text-sky-500",
  pain_points: "text-red-500",
  opportunities: "text-amber-500",
  actionable_insights: "text-emerald-500",
};

const BUCKET_ACTIVE_TAB: Record<Bucket, string> = {
  needs: "bg-sky-500 text-white",
  pain_points: "bg-red-500 text-white",
  opportunities: "bg-amber-500 text-white",
  actionable_insights: "bg-emerald-500 text-white",
};

const BUCKET_DOT: Record<Bucket, string> = {
  needs: "bg-sky-500",
  pain_points: "bg-red-500",
  opportunities: "bg-amber-500",
  actionable_insights: "bg-emerald-500",
};

const BUCKET_BG: Record<Bucket, string> = {
  needs: "bg-sky-50",
  pain_points: "bg-red-50",
  opportunities: "bg-amber-50",
  actionable_insights: "bg-emerald-50",
};

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function TopInsightsCarousel({ items }: { items: TopItem[] }) {
  const [activeBucket, setActiveBucket] = useState<Bucket>("needs");
  const [index, setIndex] = useState(0);

  const grouped = Object.fromEntries(
    BUCKETS.map((b) => [b, items.filter((i) => i.bucket === b)])
  ) as Record<Bucket, TopItem[]>;

  function selectBucket(b: Bucket) {
    setActiveBucket(b);
    setIndex(0);
  }

  const cards = grouped[activeBucket];
  const total = cards.length;
  const current = cards[index] ?? null;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No insights yet — synthesize observations in the Segments tab.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact tab strip */}
      <div className="flex gap-1 flex-wrap">
        {BUCKETS.map((b) => {
          const count = grouped[b].length;
          if (count === 0) return null;
          const isActive = b === activeBucket;
          return (
            <button
              key={b}
              onClick={() => selectBucket(b)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                isActive
                  ? BUCKET_ACTIVE_TAB[b]
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {BUCKET_LABELS[b]}
              <span className={cn(
                "text-[10px] tabular-nums",
                isActive ? "opacity-75" : "opacity-60"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Card */}
      {current && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold leading-snug">{current.title}</p>
          {current.body && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {current.body}
            </p>
          )}
          <p className={cn("text-[10px] font-medium mt-1", BUCKET_COLORS[activeBucket])}>
            {current.segmentName}
          </p>
        </div>
      )}

      {/* Carousel controls */}
      {total > 1 && (
        <div className="flex items-center justify-between pt-1">
          {/* Dots */}
          <div className="flex items-center gap-1">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={cn(
                  "rounded-full transition-all",
                  i === index
                    ? cn("w-4 h-1.5", BUCKET_DOT[activeBucket])
                    : "w-1.5 h-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              className="size-6 flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-center">
              {index + 1} / {total}
            </span>
            <button
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              disabled={index === total - 1}
              className="size-6 flex items-center justify-center rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Metric categories drawn from across the app ──────────────────────────────

const METRIC_OPTIONS = [
  "Page Views / Session & Engagement",
  "Creator Acquisition",
  "Return Rate / Total Visitors",
  "User Acquisition",
];

function MetricsPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = new Set(value.split("·").map((s) => s.trim()).filter(Boolean));

  function toggle(metric: string) {
    const next = new Set(selected);
    if (next.has(metric)) next.delete(metric);
    else next.add(metric);
    onChange([...next].join(" · "));
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {METRIC_OPTIONS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => toggle(m)}
          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors border ${
            selected.has(m)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

// ── Research Brief ────────────────────────────────────────────────────────────

interface Brief {
  title: string;
  description: string;
  problem_statement: string;
  idea: string;
  metrics: string;
  what_we_are_building: string;
  assumptions: string;
  out_of_scope: string;
}

const EMPTY: Brief = { title: "", description: "", problem_statement: "", idea: "", metrics: "", what_we_are_building: "", assumptions: "", out_of_scope: "" };

function isBriefFilled(d: Brief) {
  return d.problem_statement.trim().length > 0;
}

export function ResearchBriefSection({ projectId, onSave, onStatusChange }: { projectId: string; onSave?: () => void; onStatusChange?: (filled: boolean) => void }) {
  const { isAdmin } = useAdmin();
  const router = useRouter();
  const [draft, setDraft] = useState<Brief>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);

  async function seedSampleData() {
    setSeeding(true);
    try {
      const res = await fetch(`/api/design/research/projects/${projectId}/seed`, { method: "POST" });
      if (!res.ok) return;
      // Reload the brief fields from the server
      const data = await fetch(`/api/design/research/projects/${projectId}`).then((r) => r.json());
      if (data) {
        const seeded: Brief = {
          title: data.name ?? "",
          description: data.description ?? "",
          problem_statement: data.problem_statement ?? "",
          idea: data.idea ?? "",
          metrics: data.metrics ?? "",
          what_we_are_building: data.what_we_are_building ?? "",
          assumptions: data.assumptions ?? "",
          out_of_scope: data.out_of_scope ?? "",
        };
        setDraft(seeded);
        onSave?.();
        onStatusChange?.(isBriefFilled(seeded));
      }
    } finally {
      setSeeding(false);
    }
  }

  useEffect(() => {
    fetch(`/api/design/research/projects/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          const loaded: Brief = {
            title: data.name ?? "",
            description: data.description ?? "",
            problem_statement: data.problem_statement ?? "",
            idea: data.idea ?? "",
            metrics: data.metrics ?? "",
            what_we_are_building: data.what_we_are_building ?? "",
            assumptions: data.assumptions ?? "",
            out_of_scope: data.out_of_scope ?? "",
          };
          setDraft(loaded);
          setLoaded(true);
          onStatusChange?.(isBriefFilled(loaded));
        }
      })
      .catch(() => {});
  }, [projectId]);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/design/research/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.title || "Untitled Project",
          description: draft.description || null,
          problem_statement: draft.problem_statement || null,
          idea: draft.idea || null,
          metrics: draft.metrics || null,
          what_we_are_building: draft.what_we_are_building || null,
          assumptions: draft.assumptions || null,
          out_of_scope: draft.out_of_scope || null,
        }),
      });
      onSave?.();
      onStatusChange?.(isBriefFilled(draft));
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <div className="flex justify-center py-12"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>;

  // ── Admin: always-visible editable form ───────────────────────────────────
  if (isAdmin) {
    return (
      <div className="space-y-5">
        {/* Seed sample data — only shown when brief is empty */}
        {!isBriefFilled(draft) && (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Start with sample data</p>
              <p className="text-xs text-muted-foreground mt-0.5">Load a Creator Tools mock project with pre-filled brief and observations.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0 ml-4" onClick={seedSampleData} disabled={seeding}>
              {seeding ? <Loader2 className="size-3.5 animate-spin" /> : <FlaskConical className="size-3.5" />}
              Seed sample data
            </Button>
          </div>
        )}
        {/* Title + description inline edit */}
        {editingHeader ? (
          <div>
            <Textarea
              autoFocus
              placeholder="Project title…"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              rows={1}
              className="w-full resize-none border-none bg-transparent px-0 py-0 min-h-0 text-2xl md:text-2xl leading-snug font-bold shadow-none outline-none ring-0 placeholder:text-muted-foreground/35 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Textarea
              placeholder="Add a description…"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={1}
              className="mt-1 w-full resize-none border-none bg-transparent px-0 py-0 min-h-0 text-base md:text-base text-muted-foreground leading-relaxed shadow-none outline-none ring-0 placeholder:text-muted-foreground/35 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs px-0 text-muted-foreground" onClick={() => setEditingHeader(false)}>Done</Button>
          </div>
        ) : (
          <div className="flex items-start gap-2 group/header">
            <div className="flex-1 min-w-0 cursor-text" onClick={() => setEditingHeader(true)}>
              {draft.title
                ? <h2 className="text-2xl font-bold leading-snug">{draft.title}</h2>
                : <p className="text-2xl font-bold text-muted-foreground/40 italic">Untitled project</p>
              }
              {draft.description
                ? <p className="text-base text-muted-foreground mt-1 leading-relaxed">{draft.description}</p>
                : <p className="text-base text-muted-foreground/40 italic mt-1">Add a description…</p>
              }
            </div>
            <button onClick={() => setEditingHeader(true)} className="opacity-0 group-hover/header:opacity-100 transition-opacity mt-0.5 shrink-0">
              <Pencil className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          </div>
        )}
        <div className="h-px bg-border" />
        <div className="space-y-4">
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Research question</p>
            <Textarea placeholder="What gap in experience are we trying to understand?" value={draft.problem_statement} onChange={(e) => setDraft((d) => ({ ...d, problem_statement: e.target.value }))} rows={2} className="text-sm resize-none" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Working hypothesis</p>
            <Textarea placeholder="What do we suspect is true going in?" value={draft.idea} onChange={(e) => setDraft((d) => ({ ...d, idea: e.target.value }))} rows={2} className="text-sm resize-none" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">What we're building / testing</p>
            <Textarea placeholder={"List the specific capabilities or features being explored — one per line.\ne.g. Scheduled posts\nPerformance dashboard\nEngagement prompts"} value={draft.what_we_are_building} onChange={(e) => setDraft((d) => ({ ...d, what_we_are_building: e.target.value }))} rows={4} className="text-sm resize-none" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Assumptions to validate</p>
            <Textarea placeholder={"What could invalidate this direction?\ne.g. Creators want scheduling but won't use it if setup is complex\nTeam posting needs attribution to maintain reader trust"} value={draft.assumptions} onChange={(e) => setDraft((d) => ({ ...d, assumptions: e.target.value }))} rows={3} className="text-sm resize-none" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Out of scope</p>
            <Textarea placeholder={"What is this research NOT about?\ne.g. Cross-posting from external platforms\nContent monetization or gating"} value={draft.out_of_scope} onChange={(e) => setDraft((d) => ({ ...d, out_of_scope: e.target.value }))} rows={3} className="text-sm resize-none" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">Metrics of success</p>
            <MetricsPicker value={draft.metrics} onChange={(v) => setDraft((d) => ({ ...d, metrics: v }))} />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button size="sm" onClick={save} disabled={saving} variant="outline">
            {saving ? <><Loader2 className="size-3.5 animate-spin mr-1.5" />Saving…</> : "Save brief"}
          </Button>
          <Button
            size="sm"
            disabled={!isBriefFilled(draft)}
            onClick={() => router.push(`/research/${projectId}?tab=overview`)}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // ── Non-admin: always-visible read-only view ──────────────────────────────
  return (
    <div className="space-y-5">
      {(draft.title || draft.description) && (
        <div>
          {draft.title && <h2 className="text-2xl font-bold leading-snug">{draft.title}</h2>}
          {draft.description && <p className="text-base text-muted-foreground mt-1 leading-relaxed">{draft.description}</p>}
        </div>
      )}
      <div className="space-y-4">
        {draft.problem_statement && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Research question</p>
            <p className="text-sm leading-relaxed">{draft.problem_statement}</p>
          </div>
        )}
        {draft.idea && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Working hypothesis</p>
            <p className="text-sm leading-relaxed">{draft.idea}</p>
          </div>
        )}
        {draft.what_we_are_building && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">What we're building / testing</p>
            <ul className="space-y-1">
              {draft.what_we_are_building.split("\n").map((s) => s.trim()).filter(Boolean).map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
        {draft.assumptions && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Assumptions to validate</p>
            <ul className="space-y-1">
              {draft.assumptions.split("\n").map((s) => s.trim()).filter(Boolean).map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 rounded-full bg-amber-400/60 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
        {draft.out_of_scope && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Out of scope</p>
            <ul className="space-y-1">
              {draft.out_of_scope.split("\n").map((s) => s.trim()).filter(Boolean).map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1.5 rounded-full bg-muted-foreground/30 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
        {draft.metrics && (
          <div className="flex items-start gap-2 pt-1 border-t border-border">
            <BarChart2 className="size-3.5 text-muted-foreground/50 shrink-0 mt-0.5" />
            <div className="flex flex-wrap gap-1.5">
              {draft.metrics.split("·").map((m) => m.trim()).filter(Boolean).map((metric) => (
                <Badge key={metric} variant="secondary" className="text-[11px] font-normal">{metric}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

export function OverviewTab({ dashboard, projectId }: { dashboard: DashboardData; projectId: string }) {
  const {
    observationCount,
    areaBreakdown,
    segmentCount,
    totalInsights,
    segments,
    topItems,
  } = dashboard;

  const maxArea = Math.max(1, ...areaBreakdown.map((a) => a.count));
  const hasInsights = totalInsights > 0;

  const stats = [
    { label: "Observations", value: observationCount, icon: Eye, href: `/research/${projectId}?tab=observations` },
    { label: "Segments", value: segmentCount, icon: Users, href: `/research/${projectId}?tab=segments` },
    { label: "Insights", value: totalInsights, icon: Lightbulb, href: `/research/${projectId}?tab=segments` },
    { label: "Areas", value: areaBreakdown.length, icon: Target, href: `/research/${projectId}?tab=reference` },
  ];

  return (
    <div className="space-y-6">

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Left column: bucket rows + carousel */}
        <div className="space-y-3">

          {/* Bucket rows */}
          {hasInsights && (
            <div className="space-y-1.5">
              {(["needs", "pain_points", "opportunities", "actionable_insights"] as Bucket[]).map((bucket) => {
                const Icon = BUCKET_ICONS[bucket];
                const total = segments.reduce((sum, seg) => sum + (seg.itemCounts[bucket] ?? 0), 0);
                if (!total) return null;
                return (
                  <div key={bucket} className={cn("flex items-center justify-between rounded-lg px-3 py-2", BUCKET_BG[bucket])}>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("size-3.5 shrink-0", BUCKET_COLORS[bucket])} />
                      <span className={cn("text-xs font-semibold", BUCKET_COLORS[bucket])}>{BUCKET_LABELS[bucket]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {segments.filter(s => (s.itemCounts[bucket] ?? 0) > 0).length} segments
                      </span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{total}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Top insights carousel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">Top Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <TopInsightsCarousel items={topItems} />
            </CardContent>
          </Card>

        </div>

        <div className="space-y-6">

          {/* Segments summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold">Segments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {segments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No segments yet.</p>
              ) : (
                segments.map((seg) => (
                  <div key={seg.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-b-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="size-3.5 shrink-0 text-muted-foreground/50" />
                      <span className="text-sm font-medium truncate">{seg.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {(["needs", "pain_points", "opportunities", "actionable_insights"] as Bucket[]).map((b) => {
                        const count = seg.itemCounts[b];
                        if (!count) return null;
                        const Icon = BUCKET_ICONS[b];
                        return (
                          <div key={b} className="flex items-center gap-0.5" title={BUCKET_LABELS[b]}>
                            <Icon className={cn("size-3", BUCKET_COLORS[b])} />
                            <span className="text-[10px] text-muted-foreground tabular-nums">{count}</span>
                          </div>
                        );
                      })}
                      {seg.totalItems === 0 && (
                        <span className="text-[10px] text-muted-foreground/50">No insights</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Observation areas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl font-semibold">Observation Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {areaBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No observations yet.</p>
              ) : (
                areaBreakdown.slice(0, 8).map((area, i) => (
                  <div key={area.area} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate pr-2">{area.area}</span>
                      <span className="font-medium tabular-nums shrink-0">{area.count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${(area.count / maxArea) * 100}%`,
                          backgroundColor: chartColors[i % chartColors.length],
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
              {areaBreakdown.length > 8 && (
                <p className="text-[10px] text-muted-foreground pt-1">
                  +{areaBreakdown.length - 8} more areas
                </p>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

    </div>
  );
}
