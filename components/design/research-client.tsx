"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  Target,
  Layers,
  BarChart3,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Gauge,
  CheckCircle2,
  Zap,
  Plus,
  Sparkles,
  Loader2,
  Link2,
  Filter,
  Clock,
  LayoutGrid,
  Copy,
  Check,
  Users,
  ChevronDown,
  ChevronRight,
  Play,
  CircleDot,
  Rocket,
  MessageCircleQuestion,
  Trophy,
  TrendingUp,
  MessageSquareText,
  Activity,
  FlaskConical,
  Eye,
  BookOpen,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SynthesizeButton } from "@/components/design/synthesize-button";
import type { ResearchInsight } from "@/lib/research-types";
import {
  AREA_TAGS,
  type Observation,
  type Segment,
  type SegmentItem,
  type Bucket,
  BUCKET_LABELS,
} from "@/lib/research-hub-types";
import {
  replays,
  synthesis,
  type ReplaySynthesis,
} from "@/lib/replay-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Shared Constants ────────────────────────────────────────────────────────

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const confidenceBadge: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  validated: { label: "Validated", variant: "default" },
  assumed: { label: "Assumed", variant: "secondary" },
  speculative: { label: "Speculative", variant: "outline" },
};

// ── Tab Types ───────────────────────────────────────────────────────────────

type Tab = "overview" | "observations" | "segments" | "replays" | "reference";

interface Props {
  batch: {
    batchId: string;
    createdAt: string;
    insights: ResearchInsight[];
  } | null;
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ResearchClient({ batch: initialBatch }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [batch, setBatch] = useState(initialBatch);
  const [seeding, setSeeding] = useState(false);

  async function handleSeedDemo() {
    setSeeding(true);
    try {
      const res = await fetch("/api/design/research/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Seed failed");
        return;
      }
      toast.success(
        `Seeded ${data.seeded.observations} observations, ${data.seeded.segments} segments, ${data.seeded.insights} insights`
      );
      // Reload to pick up new data (server component fetches batch)
      window.location.reload();
    } catch {
      toast.error("Failed to seed demo data");
    } finally {
      setSeeding(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: typeof Target }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "observations", label: "Observations", icon: Eye },
    { id: "segments", label: "Segments", icon: Users },
    { id: "replays", label: "Replays", icon: Play },
    { id: "reference", label: "Reference", icon: BookOpen },
  ];

  return (
    <div className="min-w-0">
      {/* ── Header + Tab Bar ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-black tracking-tight">Research</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSeedDemo}
          disabled={seeding}
          className="gap-1.5"
        >
          {seeding ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          Seed Demo Data
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 border-b border-border">
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                selected
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ──────────────────────────────────── */}
      {activeTab === "overview" && <OverviewTab batch={batch} />}
      {activeTab === "observations" && <ObservationsTab />}
      {activeTab === "segments" && <SegmentsTab />}
      {activeTab === "replays" && <ReplaysTab />}
      {activeTab === "reference" && <ReferenceTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── OVERVIEW TAB ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function OverviewTab({ batch }: Props) {
  type OverviewSubTab = "themes" | "opportunities" | "signals" | "alignment";
  const [activeSubTab, setActiveSubTab] = useState<OverviewSubTab>("themes");

  const themes = batch?.insights.filter((i) => i.type === "theme") ?? [];
  const opportunities =
    batch?.insights.filter((i) => i.type === "opportunity") ?? [];
  const consensusItems =
    batch?.insights.filter((i) => i.type === "consensus") ?? [];
  const tensions = batch?.insights.filter((i) => i.type === "tension") ?? [];
  const openQuestions =
    batch?.insights.filter((i) => i.type === "open_question") ?? [];
  const signals = batch?.insights.filter((i) => i.type === "signal") ?? [];
  const oneMetric =
    batch?.insights.find((i) => i.type === "one_metric") ?? null;

  const themeChartData = themes.map((t, i) => ({
    name: t.title ?? "Untitled",
    mentions: t.mentions ?? 0,
    fill: chartColors[i % chartColors.length],
  }));

  const themeChartConfig: ChartConfig = Object.fromEntries(
    themes.map((t, i) => [
      `theme-${i}`,
      {
        label: t.title ?? "Untitled",
        color: chartColors[i % chartColors.length],
      },
    ])
  );
  themeChartConfig.mentions = { label: "Mentions" };

  const alignmentData = [
    { name: "Consensus", value: consensusItems.length, fill: "var(--chart-2)" },
    { name: "Tensions", value: tensions.length, fill: "var(--chart-5)" },
    { name: "Open Questions", value: openQuestions.length, fill: "var(--chart-1)" },
  ].filter((d) => d.value > 0);

  const alignmentConfig: ChartConfig = {
    consensus: { label: "Consensus", color: "var(--chart-2)" },
    tensions: { label: "Tensions", color: "var(--chart-5)" },
    openQuestions: { label: "Open Questions", color: "var(--chart-1)" },
  };

  const subTabs: { id: OverviewSubTab; label: string; value: number; icon: typeof Target }[] = [
    { id: "themes", label: "Themes", value: themes.length, icon: Target },
    { id: "opportunities", label: "Opportunities", value: opportunities.length, icon: Lightbulb },
    { id: "signals", label: "Signals", value: signals.length, icon: Zap },
    { id: "alignment", label: "Alignment", value: consensusItems.length + tensions.length + openQuestions.length, icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {batch
            ? `Last synthesized ${new Date(batch.createdAt).toLocaleDateString()}`
            : "No synthesis yet"}
        </p>
        <SynthesizeButton endpoint="/api/design/research/synthesize" />
      </div>

      {!batch ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
              No synthesis data yet. Click &ldquo;Synthesize&rdquo; to analyze
              your sessions with Ollama.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Context Sections */}
          <div className="space-y-8">
            {oneMetric && (
              <div className="flex items-start gap-5">
                <div className="size-12 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 text-lg font-bold">
                  1
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-lg font-semibold">One Metric That Matters</h3>
                  <p className="text-base font-bold tracking-tight mt-2">
                    {oneMetric.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {oneMetric.body}
                  </p>
                </div>
              </div>
            )}

            {signals.length > 0 && (
              <div className="flex items-start gap-5">
                <div className="size-12 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 text-lg font-bold">
                  2
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-lg font-semibold">Signals Worth Watching</h3>
                  <div className="mt-2 space-y-0">
                    {signals.map((signal) => (
                      <div
                        key={signal.id}
                        className="py-2 border-b border-border last:border-b-0"
                      >
                        <p className="text-sm font-medium leading-snug">
                          {signal.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {signal.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sub-Tab Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {subTabs.map((tab) => {
              const selected = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={cn(
                    "rounded-xl px-4 py-4 text-left transition-all",
                    selected
                      ? "bg-muted border border-border shadow-sm"
                      : "bg-transparent border border-transparent hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={cn(
                          "text-3xl font-black tracking-tight tabular-nums",
                          selected ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {tab.value}
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          selected ? "text-foreground font-medium" : "text-muted-foreground"
                        )}
                      >
                        {tab.label}
                      </p>
                    </div>
                    <tab.icon
                      className={cn(
                        "size-5",
                        selected ? "text-foreground/50" : "text-muted-foreground/40"
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sub-Tab Content */}
          <div className="space-y-4">
            {activeSubTab === "themes" && themes.length > 0 && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <BarChart3 className="size-4 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-xl font-semibold">
                        Theme Mentions
                      </CardTitle>
                    </div>
                    <CardDescription>Frequency across sessions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div style={{ width: "100%", height: 300, minWidth: 0 }}>
                      <ChartContainer config={themeChartConfig} className="h-[300px] w-full">
                        <BarChart
                          accessibilityLayer
                          data={themeChartData}
                          layout="vertical"
                          margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
                        >
                          <CartesianGrid horizontal={false} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            hide
                          />
                          <XAxis type="number" tickLine={false} axisLine={false} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="mentions" radius={4} barSize={20}>
                            {themeChartData.map((entry, i) => (
                              <Cell key={entry.name} fill={chartColors[i % chartColors.length]} />
                            ))}
                            <LabelList
                              dataKey="name"
                              position="insideBottomLeft"
                              offset={-16}
                              fontSize={11}
                              fill="var(--color-muted-foreground, #888)"
                            />
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Target className="size-4 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-xl font-semibold">Theme Details</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {themes.map((theme, i) => {
                      const conf = (theme.metadata as Record<string, unknown>)?.confidence as string;
                      const badge = conf ? confidenceBadge[conf] : null;
                      return (
                        <div key={theme.id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="size-3 rounded-sm shrink-0"
                              style={{ backgroundColor: chartColors[i % chartColors.length] }}
                            />
                            <span className="text-sm font-medium truncate">{theme.title}</span>
                            {badge && (
                              <Badge variant={badge.variant} className="text-[10px] shrink-0">
                                {badge.label}
                              </Badge>
                            )}
                            <span className="text-muted-foreground text-xs tabular-nums shrink-0 ml-auto">
                              {theme.mentions ?? 0} mentions
                            </span>
                          </div>
                          {theme.body && (
                            <p className="text-xs text-muted-foreground leading-relaxed pl-5">
                              {theme.body}
                            </p>
                          )}
                          {i < themes.length - 1 && <Separator className="!mt-2.5" />}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </>
            )}

            {activeSubTab === "opportunities" && opportunities.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Lightbulb className="size-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl font-semibold">Opportunities</CardTitle>
                  </div>
                  <CardDescription>How Might We questions from each theme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {opportunities.map((opp) => {
                    const conf = (opp.metadata as Record<string, unknown>)?.confidence as string;
                    const relatedTheme = (opp.metadata as Record<string, unknown>)?.theme as string;
                    const badge = conf ? confidenceBadge[conf] : null;
                    return (
                      <div key={opp.id} className="space-y-1">
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-medium leading-snug flex-1">{opp.title}</p>
                          {badge && (
                            <Badge variant={badge.variant} className="text-[10px] shrink-0 mt-0.5">
                              {badge.label}
                            </Badge>
                          )}
                        </div>
                        {relatedTheme && (
                          <p className="text-xs text-muted-foreground">Theme: {relatedTheme}</p>
                        )}
                        <Separator className="!mt-2.5" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {activeSubTab === "signals" && signals.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Zap className="size-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-xl font-semibold">Signals</CardTitle>
                  </div>
                  <CardDescription>Surprising or easy-to-overlook findings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {signals.map((signal) => (
                    <div key={signal.id} className="space-y-1">
                      <p className="text-sm font-medium leading-snug">{signal.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{signal.body}</p>
                      <Separator className="!mt-2.5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeSubTab === "alignment" && (
              <>
                {alignmentData.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Layers className="size-4 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-xl font-semibold">Alignment Overview</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-8">
                        <div style={{ width: 160, height: 160, minWidth: 0, flexShrink: 0 }}>
                          <ChartContainer config={alignmentConfig} className="h-[160px] w-[160px] shrink-0">
                            <PieChart>
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Pie
                                data={alignmentData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                strokeWidth={2}
                              >
                                {alignmentData.map((entry) => (
                                  <Cell key={entry.name} fill={entry.fill} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ChartContainer>
                        </div>
                        <div className="space-y-2">
                          {alignmentData.map((d) => (
                            <div key={d.name} className="flex items-center gap-2">
                              <div className="size-3 rounded-sm shrink-0" style={{ backgroundColor: d.fill }} />
                              <span className="text-sm">{d.name}</span>
                              <span className="text-sm font-bold tabular-nums">{d.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Layers className="size-4 text-muted-foreground" />
                      </div>
                      <CardTitle className="text-xl font-semibold">Consensus vs. Tension Map</CardTitle>
                    </div>
                    <CardDescription>Where sources agree, disagree, and leave gaps</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {consensusItems.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          Consensus
                        </div>
                        {consensusItems.map((item) => (
                          <p key={item.id} className="text-sm text-muted-foreground pl-6 leading-relaxed">
                            {item.body}
                          </p>
                        ))}
                      </div>
                    )}
                    {tensions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <AlertTriangle className="size-4 text-amber-500" />
                          Tensions
                        </div>
                        {tensions.map((item) => (
                          <p key={item.id} className="text-sm text-muted-foreground pl-6 leading-relaxed">
                            {item.body}
                          </p>
                        ))}
                      </div>
                    )}
                    {openQuestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <HelpCircle className="size-4 text-blue-500" />
                          Open Questions
                        </div>
                        {openQuestions.map((item) => (
                          <p key={item.id} className="text-sm text-muted-foreground pl-6 leading-relaxed">
                            {item.body}
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── OBSERVATIONS TAB ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function ObservationForm({ onSubmit }: { onSubmit: () => void }) {
  const [body, setBody] = useState("");
  const [area, setArea] = useState<string>(AREA_TAGS[0]);
  const [customArea, setCustomArea] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const contributor =
    typeof window !== "undefined"
      ? localStorage.getItem("research-contributor") || ""
      : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setSubmitting(true);
    try {
      const finalArea = area === "__custom" ? customArea : area;
      const res = await fetch("/api/design/research/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          area: finalArea,
          contributor: contributor || null,
          sourceUrl: sourceUrl || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
        return;
      }
      setBody("");
      setSourceUrl("");
      setShowSource(false);
      onSubmit();
      toast.success("Observation logged");
    } catch {
      toast.error("Failed to save observation");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="What did you observe? e.g. 'User hovered over share button for 12s before giving up'"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="min-h-[80px] resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {AREA_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
          <option value="__custom">+ Custom tag</option>
        </select>

        {area === "__custom" && (
          <Input
            placeholder="Custom area..."
            value={customArea}
            onChange={(e) => setCustomArea(e.target.value)}
            className="w-40 h-9"
          />
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={() => setShowSource(!showSource)}
        >
          <Link2 className="size-3.5" />
          Source
        </Button>

        <div className="flex-1" />

        <span className="text-[10px] text-muted-foreground">
          {"\u2318"}+Enter to submit
        </span>

        <Button type="submit" size="sm" disabled={submitting || !body.trim()}>
          {submitting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Plus className="size-3.5" />
          )}
          Log
        </Button>
      </div>

      {showSource && (
        <Input
          placeholder="Mixpanel replay URL, Slack link, etc."
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="h-9"
        />
      )}
    </form>
  );
}

function ShareLinkSection() {
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generateToken() {
    setGenerating(true);
    try {
      const res = await fetch("/api/design/research/share-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ createdBy: "admin" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const url = `${window.location.origin}/research/log?token=${data.token}`;
      setShareUrl(url);
    } catch {
      toast.error("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      {shareUrl ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1 min-w-0">
            {shareUrl}
          </code>
          <Button variant="ghost" size="sm" onClick={copyLink}>
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={generateToken}
          disabled={generating}
          className="gap-1.5"
        >
          <Link2 className="size-3.5" />
          Share Link
        </Button>
      )}
    </div>
  );
}

function ObservationCard({
  observation,
  selected,
  onToggle,
}: {
  observation: Observation;
  selected: boolean;
  onToggle: () => void;
}) {
  const date = new Date(observation.createdAt);
  const timeAgo = getTimeAgo(date);

  return (
    <Card
      className={`cursor-pointer transition-colors ${selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
      onClick={onToggle}
    >
      <CardContent className="p-3 flex items-start gap-3">
        <div
          className={`mt-0.5 size-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
            selected
              ? "border-primary bg-primary"
              : "border-muted-foreground/30"
          }`}
        >
          {selected && <Check className="size-2.5 text-primary-foreground" />}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm leading-relaxed">{observation.body}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {observation.area}
            </Badge>
            {observation.contributor && (
              <span className="text-[10px] text-muted-foreground">
                {observation.contributor}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            {observation.sourceUrl && (
              <a
                href={observation.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Source
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ObservationsTab() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterArea, setFilterArea] = useState<string | null>(null);
  const [groupByArea, setGroupByArea] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [synthesizing, setSynthesizing] = useState(false);

  const fetchObservations = useCallback(async () => {
    const url = filterArea
      ? `/api/design/research/observations?area=${encodeURIComponent(filterArea)}`
      : "/api/design/research/observations";
    const res = await fetch(url);
    if (res.ok) {
      setObservations(await res.json());
    }
    setLoading(false);
  }, [filterArea]);

  useEffect(() => {
    fetchObservations();
  }, [fetchObservations]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected(new Set(observations.map((o) => o.id)));
  }

  async function handleSynthesize() {
    if (selected.size === 0) return;
    setSynthesizing(true);
    try {
      const res = await fetch("/api/design/research/observe-synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ observationIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Synthesis failed");
        return;
      }
      toast.success(
        `Synthesized ${data.insightCount} insights${data.newSegments > 0 ? ` + ${data.newSegments} new segments` : ""}`
      );
      setSelected(new Set());
    } catch {
      toast.error("Synthesis failed");
    } finally {
      setSynthesizing(false);
    }
  }

  const areaCounts: Record<string, number> = {};
  for (const o of observations) {
    areaCounts[o.area] = (areaCounts[o.area] || 0) + 1;
  }

  const grouped = groupByArea
    ? Object.entries(areaCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([area]) => ({
          area,
          items: observations.filter((o) => o.area === area),
        }))
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Log what you noticed in session replays. Select observations to
          synthesize into segment insights.
        </p>
        <ShareLinkSection />
      </div>

      {/* Input Form */}
      <Card>
        <CardContent className="p-4">
          <ObservationForm onSubmit={fetchObservations} />
        </CardContent>
      </Card>

      {/* Controls Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Filter className="size-3.5 text-muted-foreground" />
          <select
            value={filterArea || ""}
            onChange={(e) => setFilterArea(e.target.value || null)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="">All areas</option>
            {Object.entries(areaCounts).map(([area, count]) => (
              <option key={area} value={area}>
                {area} ({count})
              </option>
            ))}
          </select>
        </div>

        <Button
          variant={groupByArea ? "secondary" : "ghost"}
          size="sm"
          className="gap-1 h-8"
          onClick={() => setGroupByArea(!groupByArea)}
        >
          {groupByArea ? (
            <Clock className="size-3.5" />
          ) : (
            <LayoutGrid className="size-3.5" />
          )}
          {groupByArea ? "Timeline" : "By Area"}
        </Button>

        <div className="flex-1" />

        {observations.length > 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={selectAllVisible}
            >
              Select all ({observations.length})
            </Button>

            {selected.size > 0 && (
              <Button
                size="sm"
                className="gap-1.5 h-8"
                onClick={handleSynthesize}
                disabled={synthesizing}
              >
                {synthesizing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                Synthesize ({selected.size})
              </Button>
            )}
          </>
        )}
      </div>

      {/* Observations Feed */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : observations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No observations yet.</p>
            <p className="text-xs mt-1">
              Log your first observation above, or share the link with your team.
            </p>
          </CardContent>
        </Card>
      ) : grouped ? (
        grouped.map(({ area, items }) => (
          <div key={area} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {area}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {items.length} observation{items.length !== 1 ? "s" : ""}
              </span>
            </div>
            {items.map((obs) => (
              <ObservationCard
                key={obs.id}
                observation={obs}
                selected={selected.has(obs.id)}
                onToggle={() => toggleSelect(obs.id)}
              />
            ))}
          </div>
        ))
      ) : (
        <div className="space-y-2">
          {observations.map((obs) => (
            <ObservationCard
              key={obs.id}
              observation={obs}
              selected={selected.has(obs.id)}
              onToggle={() => toggleSelect(obs.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── SEGMENTS TAB ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

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

function AddSegmentForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/design/research/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create segment");
        return;
      }
      setName("");
      setDescription("");
      setOpen(false);
      onCreated();
      toast.success("Segment created");
    } catch {
      toast.error("Failed to create segment");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-3.5" />
        Add Segment
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            placeholder="Segment name (e.g. Active Members)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting || !name.trim()}>
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
              Create
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SegmentCard({ segment }: { segment: Segment }) {
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<SegmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/design/research/segments/${segment.id}/items`);
    if (res.ok) {
      setItems(await res.json());
    }
    setLoading(false);
  }, [segment.id]);

  useEffect(() => {
    if (expanded && items.length === 0) {
      fetchItems();
    }
  }, [expanded, items.length, fetchItems]);

  const bucketCounts: Partial<Record<Bucket, number>> = {};
  for (const item of items) {
    bucketCounts[item.bucket] = (bucketCounts[item.bucket] || 0) + 1;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
        >
          {expanded ? (
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
          )}
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{segment.name}</p>
            {segment.description && (
              <p className="text-xs text-muted-foreground truncate">{segment.description}</p>
            )}
          </div>
          {items.length > 0 && (
            <div className="flex gap-1.5">
              {(Object.entries(bucketCounts) as [Bucket, number][]).map(([bucket, count]) => {
                const Icon = BUCKET_ICONS[bucket];
                return (
                  <div key={bucket} className="flex items-center gap-0.5" title={BUCKET_LABELS[bucket]}>
                    <Icon className={`size-3 ${BUCKET_COLORS[bucket]}`} />
                    <span className="text-[10px] text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </button>

        {expanded && (
          <div className="border-t border-border px-4 pb-4 pt-3">
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No insights yet. Synthesize observations to populate this segment.
              </p>
            ) : (
              <div className="space-y-4">
                {(["needs", "pain_points", "opportunities", "actionable_insights"] as Bucket[]).map(
                  (bucket) => {
                    const bucketItems = items.filter((i) => i.bucket === bucket);
                    if (bucketItems.length === 0) return null;
                    const Icon = BUCKET_ICONS[bucket];
                    return (
                      <div key={bucket}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Icon className={`size-3.5 ${BUCKET_COLORS[bucket]}`} />
                          <span className="text-xs font-semibold">{BUCKET_LABELS[bucket]}</span>
                          <Badge variant="secondary" className="text-[9px]">
                            {bucketItems.length}
                          </Badge>
                        </div>
                        <div className="space-y-1.5 pl-5">
                          {bucketItems.map((item) => (
                            <div key={item.id} className="space-y-0.5">
                              <p className="text-sm font-medium">{item.title}</p>
                              {item.body && (
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {item.body}
                                </p>
                              )}
                              {item.sourceObservationIds && item.sourceObservationIds.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Link2 className="size-2.5 text-muted-foreground/50" />
                                  <span className="text-[9px] text-muted-foreground/50">
                                    {item.sourceObservationIds.length} source observation
                                    {item.sourceObservationIds.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SegmentsTab() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSegments = useCallback(async () => {
    const res = await fetch("/api/design/research/segments");
    if (res.ok) {
      setSegments(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Knowledge base of user needs, pain points, and opportunities — built
          from synthesized observations.
        </p>
        <AddSegmentForm onCreated={fetchSegments} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : segments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="size-8 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium">No segments defined yet</p>
            <p className="text-xs mt-1">
              Create segments like &quot;Active Members&quot;,
              &quot;Creators&quot;, or &quot;New Users from Invite&quot; to
              organize your research.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {segments.map((segment) => (
            <SegmentCard key={segment.id} segment={segment} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── REPLAYS TAB ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const frictionChartConfig = {
  frequency: { label: "Sessions", color: "var(--chart-1)" },
} satisfies ChartConfig;

const severityColor: Record<string, string> = {
  critical: "var(--chart-1)",
  high: "var(--chart-2)",
  medium: "var(--chart-3)",
  low: "var(--chart-4)",
};

const quadrantLabel: Record<string, { label: string; color: string }> = {
  quick_win: { label: "Quick Win", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  big_bet: { label: "Big Bet", color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 border-violet-500/20" },
  worth_doing: { label: "Worth Doing", color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20" },
  low_priority: { label: "Low Priority", color: "text-muted-foreground bg-muted border-border" },
};

function ReplaysTab() {
  const [synth, setSynth] = useState<ReplaySynthesis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSynthesize() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/design/research/replay-synthesize", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Synthesis failed");
      }
      const batchRes = await fetch("/api/design/research/replay-insights");
      if (batchRes.ok) {
        const data = await batchRes.json();
        setSynth(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Annotated Mixpanel recordings with friction analysis and recommendations.
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSynthesize}
          disabled={loading}
          className="gap-1.5"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Sparkles className="size-3.5" />
          )}
          {loading ? "Synthesizing..." : "Synthesize Replays"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Synthesis Results */}
      {synth && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {synth.takeaway && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="size-4 text-amber-500" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      Key Takeaway
                    </p>
                  </div>
                  <p className="text-sm font-semibold leading-snug">{synth.takeaway.title}</p>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {synth.takeaway.detail}
                  </p>
                </CardContent>
              </Card>
            )}

            {synth.frictions.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="size-4 text-muted-foreground" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Top Friction Patterns
                    </p>
                  </div>
                  <div style={{ width: "100%", height: 140, minWidth: 0 }}>
                    <ChartContainer config={frictionChartConfig} className="h-[140px] w-full">
                      <BarChart
                        data={synth.frictions.slice(0, 5)}
                        layout="vertical"
                        margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="pattern"
                          width={100}
                          tick={{ fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="frequency" radius={[0, 4, 4, 0]}>
                          {synth.frictions.slice(0, 5).map((f, i) => (
                            <Cell key={i} fill={severityColor[f.severity] || "var(--chart-5)"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {synth.matrix.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Effort-Impact Matrix
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(["quick_win", "big_bet", "worth_doing", "low_priority"] as const).map((q) => {
                    const items = synth.matrix.filter((m) => m.quadrant === q);
                    const info = quadrantLabel[q];
                    return (
                      <div key={q} className={`rounded-lg border p-3 ${info.color}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-2">
                          {info.label}
                        </p>
                        {items.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground italic">None</p>
                        ) : (
                          <ul className="space-y-1">
                            {items.map((item, i) => (
                              <li key={i} className="text-xs leading-relaxed">
                                {item.issue}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Hero Stats */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
          Summary
        </p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: synthesis.sessionsReviewed, label: "Sessions", color: "text-foreground" },
            { value: synthesis.totalFriction, label: "Friction", color: "text-amber-500 dark:text-amber-400" },
            { value: synthesis.criticalIssues, label: "Critical", color: "text-red-500 dark:text-red-400" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={`text-3xl font-black tabular-nums leading-none ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Area Breakdown */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Findings by Area</h3>
        {synthesis.themes.map((theme) => (
          <div key={theme.area} className="rounded-xl border border-border p-4 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className={`size-7 rounded-lg ${theme.color} flex items-center justify-center`}>
                <CircleDot className="size-3.5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">{theme.area}</p>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${
                  theme.impact === "Critical"
                    ? "border-red-500/30 bg-red-500/10 text-red-500"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {theme.impact}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{theme.summary}</p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] text-muted-foreground/60 shrink-0">
                top: {theme.topIssue}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="size-3.5 text-emerald-500" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Quick Wins
            </p>
          </div>
          <div className="space-y-2">
            {synthesis.quickWins.map((win, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="size-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                    {i + 1}
                  </span>
                </div>
                <span className="text-xs text-foreground/80 leading-relaxed">{win}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="size-3.5 text-violet-500" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Big Bets
            </p>
          </div>
          <div className="space-y-2">
            {synthesis.bigBets.map((bet, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="size-4 rounded-full border border-violet-500/30 bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400">
                    {i + 1}
                  </span>
                </div>
                <span className="text-xs text-foreground/80 leading-relaxed">{bet}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Threads */}
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircleQuestion className="size-3.5 text-muted-foreground" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Open Threads
          </p>
        </div>
        <div className="space-y-2.5">
          {synthesis.openThreads.map((thread, i) => (
            <p
              key={i}
              className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-muted-foreground/15"
            >
              {thread}
            </p>
          ))}
        </div>
      </div>

      {/* Replay Cards */}
      {replays.map((replay) => (
        <Card key={replay.id}>
          <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <div className="size-12 rounded-full bg-background/80 flex items-center justify-center">
                <Play className="size-5 ml-0.5" />
              </div>
              <span className="text-xs">Session recording</span>
            </div>
          </div>

          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold leading-snug">{replay.title}</CardTitle>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="outline" className="text-xs">{replay.dateReviewed}</Badge>
              <Badge variant="outline" className="text-xs">{replay.sessionSource}</Badge>
              <Badge variant="outline" className="text-xs">{replay.sessionLength}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <h4 className="text-sm font-semibold mb-1.5">User Context</h4>
              <div className="text-sm text-muted-foreground space-y-0.5">
                <p><span className="text-foreground font-medium">Type:</span> {replay.userContext.userType}</p>
                <p><span className="text-foreground font-medium">Device:</span> {replay.userContext.device}</p>
                <p><span className="text-foreground font-medium">Entry:</span> {replay.userContext.entryPoint}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-1.5">What Happened</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{replay.whatHappened}</p>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-1.5">What Worked</h4>
              <ul className="space-y-1">
                {replay.whatWorked.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-emerald-500 shrink-0">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-1.5">Friction Points</h4>
              <ul className="space-y-1">
                {replay.frictionPoints.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-red-500 shrink-0">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2">Findings</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Issue</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">User Impact</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Metric Affected</th>
                      <th className="pb-2 font-medium text-muted-foreground">Effort</th>
                    </tr>
                  </thead>
                  <tbody>
                    {replay.findings.map((finding, i) => (
                      <tr key={i} className="border-b border-border last:border-b-0">
                        <td className="py-2 pr-4 font-medium">{finding.issue}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{finding.userImpact}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{finding.metricAffected}</td>
                        <td className="py-2">
                          <Badge variant="secondary" className="text-[10px]">{finding.effort}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-1.5">Recommendation</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{replay.recommendation}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-1.5">Open Questions</h4>
              <ul className="space-y-1">
                {replay.openQuestions.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-foreground shrink-0">?</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── REFERENCE TAB ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const referenceOverviewStats = [
  { label: "Total Insights", value: 17, icon: FlaskConical },
  { label: "Active Themes", value: 4, icon: Target },
  { label: "Contributors", value: 8, icon: Users },
  { label: "Surface Areas", value: 5, icon: Layers },
];

const referenceThemes = [
  { title: "Recipe organization & collections", mentions: 47 },
  { title: "Ingredient-aware search", mentions: 34 },
  { title: "Nutrition visibility", mentions: 28 },
  { title: "Seasonal & contextual surfacing", mentions: 21 },
];

const referenceSurfaceAreas = [
  { area: "Cookbook & Saved Recipes", frequency: 47, context: "Organization, folders, collections, bulk actions" },
  { area: "Search & Discovery", frequency: 34, context: "Ingredient-first, filters, contextual suggestions" },
  { area: "Recipe Cards", frequency: 28, context: "Nutrition data, comparison view, compact mode" },
  { area: "Creator Pages", frequency: 19, context: "Navigation, branding, cross-linking" },
  { area: "Import Pipeline", frequency: 14, context: "PDF parsing, error handling, unit normalization" },
];

const referenceTeamResearch = [
  {
    initials: "DT",
    color: "bg-indigo-600",
    team: "Design Team",
    date: "Feb 28, 2026",
    title: "Navigation patterns that reduce drop-off by 23%",
    summary: "Persistent bottom bar with save + share outperforms hamburger menus across every cohort. Mobile users engaged 23% more when actions stayed visible.",
  },
  {
    initials: "ET",
    color: "bg-emerald-600",
    team: "Eng Team",
    date: "Feb 25, 2026",
    title: "Recipe import pipeline: error rate dropped to 0.4%",
    summary: "Two-pass parser normalizes ingredient strings, then validates against unit dictionary. Import failures went from 3.1% to 0.4%.",
  },
];

const referenceCommunityVoices = [
  { initials: "SL", color: "bg-rose-500", name: "Sarah Lin", role: "Community Leader", quote: "My audience keeps asking for a way to compare similar recipes side-by-side.", tags: ["Recipe Comparison", "UX"] },
  { initials: "MK", color: "bg-amber-500", name: "Marcus Kim", role: "Community Leader", quote: "The save button works great, but there's no way to organize saved recipes into folders.", tags: ["Collections", "Cookbook"] },
  { initials: "AW", color: "bg-violet-500", name: "Alex W.", role: "Member", quote: "I wish I could filter by what I already have in my fridge.", tags: ["Search", "Ingredients"] },
  { initials: "RD", color: "bg-sky-500", name: "Rachel D.", role: "Member", quote: "Love the recipe cards but the nutrition info is hard to find.", tags: ["Nutrition", "Cards"] },
];

const referenceActivityTimeline = [
  { type: "research", icon: FlaskConical, title: "Navigation patterns that reduce drop-off by 23%", source: "Design Team", date: "Feb 28" },
  { type: "voice", icon: MessageSquareText, title: "Recipe comparison request from Sarah Lin", source: "Community Leader", date: "Feb 27" },
  { type: "research", icon: FlaskConical, title: "Recipe import pipeline: error rate dropped to 0.4%", source: "Eng Team", date: "Feb 25" },
  { type: "theme", icon: TrendingUp, title: "Recipe organization & collections trending up", source: "47 mentions", date: "Feb 24" },
  { type: "voice", icon: MessageSquareText, title: "Collections feedback from Marcus Kim", source: "Community Leader", date: "Feb 23" },
  { type: "surface", icon: Layers, title: "Search & Discovery surface area identified", source: "34 mentions", date: "Feb 22" },
];

function ReferenceTab() {
  const maxMentions = Math.max(...referenceThemes.map((t) => t.mentions));

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Static reference — insights aggregated from teams, community leaders, and members.
      </p>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {referenceOverviewStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-4 px-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
                <stat.icon className="size-5 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Themes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <BarChart3 className="size-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-semibold">Top Themes</CardTitle>
          </div>
          <CardDescription>By mention count across all sources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {referenceThemes.map((theme, i) => (
            <div key={theme.title} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate pr-2">{theme.title}</span>
                <span className="text-muted-foreground font-medium tabular-nums shrink-0">
                  {theme.mentions}
                </span>
              </div>
              <div className="h-4 w-full rounded-sm bg-muted">
                <div
                  className="h-4 rounded-sm transition-all"
                  style={{
                    width: `${(theme.mentions / maxMentions) * 100}%`,
                    backgroundColor: chartColors[i % chartColors.length],
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Surface Areas */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Layers className="size-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-semibold">Surface Areas</CardTitle>
          </div>
          <CardDescription>Product areas by frequency of mention</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {referenceSurfaceAreas.map((area, i) => (
            <div key={area.area} className="flex items-stretch gap-3">
              <div
                className="flex items-center justify-center rounded-md w-12 shrink-0 text-sm font-bold"
                style={{
                  backgroundColor: `color-mix(in srgb, ${chartColors[i % chartColors.length]} 15%, transparent)`,
                  color: chartColors[i % chartColors.length],
                }}
              >
                {area.frequency}x
              </div>
              <div className="min-w-0 py-0.5">
                <p className="text-sm font-medium leading-snug">{area.area}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{area.context}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Activity className="size-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-semibold">Activity Timeline</CardTitle>
          </div>
          <CardDescription>Latest entries across all categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {referenceActivityTimeline.map((entry, i) => (
              <div
                key={`${entry.title}-${i}`}
                className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0"
              >
                <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <entry.icon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug truncate">{entry.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{entry.source}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{entry.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Research */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <FlaskConical className="size-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-semibold">Team Research</CardTitle>
          </div>
          <CardDescription>Latest findings from internal teams</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {referenceTeamResearch.map((entry) => (
            <div key={entry.title} className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`size-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 ${entry.color}`}
                >
                  {entry.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {entry.team} &middot; {entry.date}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold leading-snug">{entry.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                {entry.summary}
              </p>
              <Separator className="!mt-3" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Community Voices */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <MessageSquareText className="size-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-semibold">Community Voices</CardTitle>
          </div>
          <CardDescription>Leaders and member feedback</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {referenceCommunityVoices.map((voice) => (
            <div key={voice.name} className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`size-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 ${voice.color}`}
                >
                  {voice.initials}
                </div>
                <span className="text-sm font-medium">{voice.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {voice.role}
                </Badge>
              </div>
              <blockquote className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                &ldquo;{voice.quote}&rdquo;
              </blockquote>
              <div className="flex gap-1.5 flex-wrap">
                {voice.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Separator className="!mt-3" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
