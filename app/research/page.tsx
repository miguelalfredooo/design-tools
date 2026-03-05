import {
  TrendingUp,
  MessageSquareText,
  Target,
  Layers,
  BarChart3,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Gauge,
  CheckCircle2,
  Zap,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SynthesizeButton } from "@/components/design/synthesize-button";
import { supabase } from "@/lib/supabase";
import type { ResearchInsightRow, InsightType } from "@/lib/research-types";
import { insightFromRow } from "@/lib/research-types";

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const confidenceBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  validated: { label: "Validated", variant: "default" },
  assumed: { label: "Assumed", variant: "secondary" },
  speculative: { label: "Speculative", variant: "outline" },
};

async function getLatestBatch() {
  if (!supabase) return null;

  // Get the most recent batch_id
  const { data: latest } = await supabase
    .from("research_insights")
    .select("batch_id, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!latest) return null;

  // Get all rows for that batch
  const { data: rows } = await supabase
    .from("research_insights")
    .select("*")
    .eq("batch_id", latest.batch_id)
    .order("created_at", { ascending: true });

  if (!rows) return null;

  const insights = (rows as ResearchInsightRow[]).map(insightFromRow);
  return {
    batchId: latest.batch_id,
    createdAt: latest.created_at,
    insights,
  };
}

export default async function ResearchPage() {
  const batch = await getLatestBatch();

  const themes = batch?.insights.filter((i) => i.type === "theme") ?? [];
  const opportunities = batch?.insights.filter((i) => i.type === "opportunity") ?? [];
  const consensusItems = batch?.insights.filter((i) => i.type === "consensus") ?? [];
  const tensions = batch?.insights.filter((i) => i.type === "tension") ?? [];
  const openQuestions = batch?.insights.filter((i) => i.type === "open_question") ?? [];
  const signals = batch?.insights.filter((i) => i.type === "signal") ?? [];
  const oneMetric = batch?.insights.find((i) => i.type === "one_metric") ?? null;

  const maxMentions = Math.max(...themes.map((t) => t.mentions ?? 0), 1);

  return (
    <div className="flex justify-center min-w-0 pt-6 pb-12 px-4">
      <div className="flex gap-6 items-start justify-center">
        {/* Left Column */}
        <div className="w-[320px] shrink-0 sticky top-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Research</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {batch
                  ? `Last synthesized ${new Date(batch.createdAt).toLocaleDateString()}`
                  : "No synthesis yet"}
              </p>
            </div>
            <SynthesizeButton />
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Themes", value: themes.length, icon: Target },
              { label: "Opportunities", value: opportunities.length, icon: Lightbulb },
              { label: "Signals", value: signals.length, icon: Zap },
              { label: "Tensions", value: tensions.length, icon: AlertTriangle },
            ].map((stat) => (
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

          {/* One Metric That Matters */}
          {oneMetric && (
            <Card className="border-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">One Metric That Matters</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold tracking-tight">{oneMetric.title}</p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {oneMetric.body}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Signals Worth Watching */}
          {signals.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold">Signals Worth Watching</CardTitle>
                </div>
                <CardDescription>Surprising or easy-to-overlook findings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-0">
                  {signals.map((signal) => (
                    <div
                      key={signal.id}
                      className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0"
                    >
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Zap className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{signal.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {signal.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="w-[600px] min-w-0 space-y-4">
          {!batch ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground">
                  No synthesis data yet. Click &ldquo;Synthesize&rdquo; to analyze your sessions with Ollama.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Emerging Themes */}
              {themes.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="size-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-semibold">Emerging Themes</CardTitle>
                    </div>
                    <CardDescription>Recurring patterns across sessions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {themes.map((theme, i) => {
                      const conf = (theme.metadata as Record<string, unknown>)?.confidence as string;
                      const badge = conf ? confidenceBadge[conf] : null;
                      return (
                        <div key={theme.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{theme.title}</span>
                              {badge && (
                                <Badge variant={badge.variant} className="text-[10px] shrink-0">
                                  {badge.label}
                                </Badge>
                              )}
                            </div>
                            <span className="text-muted-foreground font-medium tabular-nums shrink-0 ml-2">
                              {theme.mentions ?? 0}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${((theme.mentions ?? 0) / maxMentions) * 100}%`,
                                backgroundColor: chartColors[i % chartColors.length],
                              }}
                            />
                          </div>
                          {theme.body && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {theme.body}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Opportunities (How Might We) */}
              {opportunities.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="size-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-semibold">Opportunities</CardTitle>
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
                            <p className="text-sm font-medium leading-snug flex-1">
                              {opp.title}
                            </p>
                            {badge && (
                              <Badge variant={badge.variant} className="text-[10px] shrink-0 mt-0.5">
                                {badge.label}
                              </Badge>
                            )}
                          </div>
                          {relatedTheme && (
                            <p className="text-xs text-muted-foreground">
                              Theme: {relatedTheme}
                            </p>
                          )}
                          <Separator className="!mt-2.5" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Consensus vs. Tension Map */}
              {(consensusItems.length > 0 || tensions.length > 0 || openQuestions.length > 0) && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="size-4 text-muted-foreground" />
                      <CardTitle className="text-sm font-semibold">
                        Consensus vs. Tension Map
                      </CardTitle>
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
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
