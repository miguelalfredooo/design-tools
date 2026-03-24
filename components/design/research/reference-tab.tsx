"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Eye,
  FlaskConical,
  Layers,
  Loader2,
  MessageSquareText,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/design/research/stat-card";
import type { Bucket } from "@/lib/research-hub-types";

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const BUCKET_COLORS: Record<Bucket, string> = {
  needs: "#0ea5e9",
  pain_points: "#ef4444",
  opportunities: "#f59e0b",
  actionable_insights: "#10b981",
};

const BUCKET_LABELS: Record<Bucket, string> = {
  needs: "Needs",
  pain_points: "Opportunities",
  opportunities: "Opportunities",
  actionable_insights: "Actionable Insights",
};

interface ReferenceData {
  stats: {
    observations: number;
    segments: number;
    insights: number;
    contributors: number;
    areas: number;
  };
  areaBreakdown: { area: string; count: number }[];
  bucketCounts: Partial<Record<Bucket, number>>;
  voices: {
    id: string;
    contributor: string;
    area: string;
    body: string;
    sourceUrl: string | null;
    createdAt: string;
  }[];
  activity: {
    type: "insight" | "observation";
    title: string;
    detail: string;
    segment: string;
    date: string;
  }[];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const avatarColors = [
  "bg-indigo-600", "bg-emerald-600", "bg-rose-500",
  "bg-amber-500", "bg-violet-500", "bg-sky-500",
];

export function ReferenceTab() {
  const [data, setData] = useState<ReferenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/design/research/reference")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, areaBreakdown, bucketCounts, voices, activity } = data;
  const maxArea = Math.max(1, ...areaBreakdown.map((a) => a.count));

  const statCards = [
    { label: "Observations", value: stats.observations, icon: Eye, href: "/research?tab=observations" },
    { label: "Segments", value: stats.segments, icon: Users, href: "/research?tab=segments" },
    { label: "Insights", value: stats.insights, icon: FlaskConical, href: "/research?tab=segments" },
    { label: "Contributors", value: stats.contributors, icon: Target },
    { label: "Surface Areas", value: stats.areas, icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Live summary of all research data — observations, segments, and synthesized insights.
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statCards.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Insight breakdown by bucket */}
        {Object.keys(bucketCounts).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Zap className="size-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-base font-semibold">Insight Breakdown</CardTitle>
              </div>
              <CardDescription>Synthesized insights by type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["needs", "pain_points", "opportunities", "actionable_insights"] as Bucket[]).map((bucket) => {
                const count = bucketCounts[bucket] ?? 0;
                if (!count) return null;
                const maxCount = Math.max(1, ...Object.values(bucketCounts).filter(Boolean) as number[]);
                return (
                  <div key={bucket} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{BUCKET_LABELS[bucket]}</span>
                      <span className="font-medium tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                          backgroundColor: BUCKET_COLORS[bucket],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Area breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <BarChart3 className="size-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-base font-semibold">Surface Areas</CardTitle>
            </div>
            <CardDescription>Observation frequency by product area</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {areaBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No observations yet.</p>
            ) : (
              areaBreakdown.map((area, i) => (
                <div key={area.area} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate pr-2">{area.area}</span>
                    <span className="font-medium tabular-nums shrink-0">{area.count}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${(area.count / maxArea) * 100}%`,
                        backgroundColor: chartColors[i % chartColors.length],
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

      {/* Activity timeline */}
      {activity.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Activity className="size-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            </div>
            <CardDescription>Latest observations and insights added</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {activity.map((entry, i) => {
                const Icon = entry.type === "insight" ? FlaskConical : Eye;
                return (
                  <div
                    key={`${entry.title}-${i}`}
                    className="flex items-start gap-3 py-2.5 border-b border-border last:border-b-0"
                  >
                    <div className="size-8 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug line-clamp-1">{entry.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.detail} · {entry.segment}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                      {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contributor voices */}
      {voices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <MessageSquareText className="size-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-base font-semibold">Contributor Voices</CardTitle>
            </div>
            <CardDescription>Observations logged with a named contributor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {voices.map((voice, i) => (
              <div key={voice.id} className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white shrink-0 ${avatarColors[i % avatarColors.length]}`}>
                    {initials(voice.contributor)}
                  </div>
                  <span className="text-sm font-medium">{voice.contributor}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{voice.area}</Badge>
                </div>
                <blockquote className="text-sm text-muted-foreground leading-relaxed line-clamp-2 pl-9">
                  &ldquo;{voice.body}&rdquo;
                </blockquote>
                <div className="h-px bg-border mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
