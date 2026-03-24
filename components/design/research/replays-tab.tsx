"use client";

import { useState } from "react";
import {
  CircleDot,
  Loader2,
  MessageCircleQuestion,
  Play,
  Rocket,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import { replays, synthesis, type ReplaySynthesis } from "@/lib/replay-data";

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

export function ReplaysTab() {
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
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          {loading ? "Synthesizing..." : "Synthesize Replays"}
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {synth ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {synth.takeaway ? (
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
            ) : null}

            {synth.frictions.length > 0 ? (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="size-4 text-muted-foreground" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Top Friction Patterns
                    </p>
                  </div>
                  <ChartContainer config={frictionChartConfig} className="h-[140px] w-full">
                    <BarChart
                      data={synth.frictions.slice(0, 5)}
                      layout="vertical"
                      margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="pattern" width={100} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="frequency" radius={[0, 4, 4, 0]}>
                        {synth.frictions.slice(0, 5).map((f, i) => (
                          <Cell key={i} fill={severityColor[f.severity] || "var(--chart-5)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {synth.matrix.length > 0 ? (
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
          ) : null}
        </div>
      ) : null}

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
